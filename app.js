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
    
    // Sub-brand Data
    const brandData = {
        'HiPro Biz': {
            url: 'https://biz.hipro-job.jp/corporation/',
            desc: '経営課題解決に取り組む企業向けの経営支援サービス。専門性の高いプロフェッショナル人材と企業をマッチング。',
            competitors: ['顧問バンク', '顧問名鑑', 'パソナジョブハブ', 'サーキュレーション']
        },
        'HiPro Direct': {
            url: 'https://hipro-job.jp/pro/service/direct/lp/',
            desc: '企業と副業・フリーランス人材をつなぐマッチングプラットフォーム。直接スカウトが可能。',
            competitors: ['複業クラウド', 'サンカク', 'ビザスク']
        },
        'HiPro Tech': {
            url: 'https://tech.hipro-job.jp/',
            desc: 'IT・テクノロジー領域特化型エージェントサービス。即戦力のエンジニアと企業を繋ぐ。',
            competitors: ['レバテックフリーランス', 'ギークスジョブ', 'ITプロパートナーズ', 'midworks', 'INTLOOP', 'findy']
        }
    };

    const switchState = (stateName) => {
        Object.values(states).forEach(el => el.classList.remove('active'));
        states[stateName].classList.add('active');
    };

    const buildPrompt = (url, brand, aspect) => {
        const bd = brandData[brand];
        const competitors = bd.competitors.join('、');
        
        let prompt = `あなたは「${brand}」の専属AI CMO（最高マーケティング責任者）である「AI CMO君」です。以下の情報を元に、競合分析と、トラフィックを増やすための戦略的施策を策定してください。

## 前提条件
・対象サービスブランド: ${brand}
・サービス概要: ${bd.desc}
・マスターブランド: HiPro (副業・フリーランスのプロ人材支援サービス)
・想定される主要競合: ${competitors}
・ユーザーが入力した仮想競合/ターゲットサイト: ${url}

今回は特に【${aspect}】の観点から深く分析し、アウトプットを出してください。
`;

        if (aspect === 'コンセプト設計') {
            prompt += `
## コンセプト設計における重要要件（必ず遵守）
森岡毅氏のマーケティング理論をベースにしてください。
Web上で推測される消費者・顧客情報（ターゲットサイトURLや既存競合からの推測）をベースに、以下のフレームワークを用いた強いコンセプトを構築してください：

1. **重心モデル（ポジショニングの重心）**
   - 競合（${competitors}および ${url}）と比較した際の、${brand}独自の「提供価値の重心」はどこにあるべきか。
2. **ブランド・エクイティ・ピラミッド**
   - 根底の機能的価値、感情的価値、そしてブランドの約束（プロミス）までを定義。
3. **具体的なメッセージング**
   - 消費者に刺さるコンセプトメッセージ案。
`;
        } else if (aspect === 'Web広告') {
            prompt += `\n以下の項目について具体的な戦略を立案してください：
- コンセプト設計（広告クリエイティブの軸）
- リスティング（入札キーワード、検索意図の捉え方）
- 静的/動的ディスプレイ（バナーのトーン＆マナー、訴求軸）
- アグリゲーションサイト/アフィリエイトサイトの活用戦略
- アライアンス施策（他社との連携シナジー）`;
        } else if (aspect === 'SEO') {
            prompt += `\n検索流入を最大化するためのSEO戦略に特化し、以下の項目を立案してください：
- ターゲットとすべきBig/Middle/Smallキーワード群
- 対象URL（${url}）や競合対比でのコンテンツギャップと、作成すべきコンテンツの方向性
- E-E-A-T（経験、専門性、権威性、信頼性）を高めるための具体策`;
        } else if (aspect === 'LPO') {
            prompt += `\nLPのコンバージョン率を最大化するLPO戦略に特化し、以下の項目を立案してください：
- 直帰率を下げるためのファーストビュー（FV）の訴求改善案
- ターゲットサイト(${url})と比較して強調すべき自社の強み（競合優位性）の表現方法
- ユーザーの不安を払拭するコンテンツ（事例、権威性、FAQ）の配置`;
        } else if (aspect === 'EFO') {
            prompt += `\n入力フォームの離脱率を下げるEFO戦略に特化し、以下の項目を立案してください：
- フォーム到達から完了までのモチベーション維持の工夫
- 心理的ハードルを下げるための入力項目とマイクロコピーの最適化案
- 競合との差別化（例：入力のしやすさ、プロフィールの自動連携など）の可能性`;
        }

        prompt += `\n\n出力は、見出しや箇条書きを活用し、読みやすく構造化されたMarkdown形式で出力してください。プロのマーケターとして、鋭く実践的な示唆を提供してください。`;
        
        return prompt;
    };

    const callGemini = async (apiKey, prompt) => {
        // Update to the latest available model for standard responses
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
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
        
        const brandObj = document.querySelector('input[name="sub-brand"]:checked');
        const aspectObj = document.querySelector('input[name="aspect"]:checked');
        
        if (!brandObj || !aspectObj) return;
        
        const brand = brandObj.value;
        const aspect = aspectObj.value;

        // Set Badges
        document.getElementById('badge-brand').textContent = brand;
        document.getElementById('badge-aspect').textContent = aspect;

        switchState('loading');

        try {
            const prompt = buildPrompt(url, brand, aspect);
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
