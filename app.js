document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cmo-form');
    const states = {
        welcome: document.getElementById('welcome-message'),
        loading: document.getElementById('loading-state'),
        error: document.getElementById('error-state'),
        result: document.getElementById('result-state')
    };
    
    const resultContainer = document.getElementById('result-content');
    const retryBtn = document.getElementById('retry-btn');
    const errorMessage = document.getElementById('error-message');
    


    const switchState = (stateName) => {
        Object.values(states).forEach(el => el.classList.remove('active'));
        states[stateName].classList.add('active');
    };

    const buildPrompt = (url, aspects) => {
        let prompt = `あなたは企業の専属AI CMO（最高マーケティング責任者）である「AI CMO君」です。以下の自社事業の情報と起点URLを元に、トラフィックを増やしCVを最大化するための総合的なマーケティング戦略・改善案を策定してください。

## 前提条件
・自社サイトの起点URL: ${url}
・分析対象となる3つのサブブランド:
  1. HiPro Biz (経営課題解決に取り組む企業向けの経営支援サービス / 主要競合: 顧問バンク、顧問名鑑など)
  2. HiPro Direct (企業と副業・フリーランス人材をつなぐマッチングプラットフォーム / 主要競合: 複業クラウド、ビザスクなど)
  3. HiPro Tech (IT・テクノロジー領域特化型エージェントサービス / 主要競合: レバテックフリーランスなど)
・ターゲット顧客層: 各事業について「個人向け（toC / プロ人材獲得）」および「法人向け（toB / 企業顧客獲得）」の双方の観点を必ず網羅すること。

今回、あなたが深掘りして具体的な示唆を出すべき分析観点は以下の【${aspects.join('、')}】です。
`;

        if (aspects.includes('コンセプト設計')) {
            prompt += `
## 【コンセプト設計】における重要要件
森岡毅氏のマーケティング理論をベースに、以下のフレームワークを用いた強いコンセプトを構築してください：
1. **重心モデル（ポジショニングの重心）**: 競合と比較した際の各事業独自の「提供価値の重心」
2. **ブランド・エクイティ・ピラミッド**: 機能的・感情的価値とブランドの約束
3. **具体的なメッセージング**: 個人・法人それぞれに刺さるメッセージ案
`;
        } 
        if (aspects.includes('Web広告')) {
            prompt += `\n## 【Web広告】に関する戦略立案\n- コンセプト設計（広告クリエイティブの軸）\n- リスティング（入札キーワード、検索意図の捉え方）\n- 静的/動的ディスプレイ（バナーのトーン＆マナー）\n- 法人/個人別のターゲティング手法`;
        } 
        if (aspects.includes('SEO')) {
            prompt += `\n## 【SEO】に関する戦略立案\n- ターゲットとすべきBig/Middle/Smallキーワード群（法人向け・個人向け別）\n- 起点URLや競合対比でのコンテンツギャップ\n- E-E-A-Tを高めるための具体策`;
        } 
        if (aspects.includes('LPO')) {
            prompt += `\n## 【LPO】に関する戦略立案\n- 直帰率を下げるためのファーストビュー（FV）の訴求改善案（法人・個人それぞれのインサイトに合わせたFV）\n- 強調すべき自社の強みの表現方法\n- ユーザーの不安を払拭するコンテンツの配置`;
        } 
        if (aspects.includes('EFO')) {
            prompt += `\n## 【EFO】に関する戦略立案\n- 法人/個人それぞれのモチベーション維持と入力項目最適化案\n- 心理的ハードルを下げるためのマイクロコピー\n- 競合との差別化（入力のしやすさ等）`;
        }

        prompt += `\n\n出力は、見出しや箇条書きを活用し、指定された全サブブランド（Biz, Direct, Tech）およびターゲット層（個人・法人）ごとに分かりやすく構造化されたMarkdown形式で出力してください。`;
        
        return prompt;
    };

    const callGemini = async (apiKey, prompt) => {
        // Update to the latest available model for standard responses
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Gemini API Error');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const apiKey = document.getElementById('api-key').value.trim();
        const url = document.getElementById('target-url').value.trim();
        
        const checkedBoxes = document.querySelectorAll('input[name="aspect"]:checked');
        
        if (checkedBoxes.length === 0) {
            alert("分析観点を1つ以上選択してください。");
            return;
        }
        
        const aspects = Array.from(checkedBoxes).map(cb => cb.value);

        // Set Badges
        document.getElementById('badge-brand').textContent = "全対象事業 (Biz/Direct/Tech)";
        document.getElementById('badge-aspect').textContent = aspects.join(', ');

        switchState('loading');

        try {
            const prompt = buildPrompt(url, aspects);
            const markdownResponse = await callGemini(apiKey, prompt);
            
            // Render markdown carefully allowing HTML from marked
            resultContainer.innerHTML = marked.parse(markdownResponse);
            switchState('result');
            
        } catch (err) {
            console.error(err);
            errorMessage.textContent = 'APIエラー: ' + err.message + '\nキーが正しいか確認してください。';
            switchState('error');
        }
    });

    retryBtn.addEventListener('click', () => {
        switchState('welcome');
    });
});
