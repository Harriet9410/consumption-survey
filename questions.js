var SURVEY_QUESTIONS = [
    {
        id: "q1",
        type: "radio",
        section: "第一部分：基本信息",
        title: "您的性别：",
        required: true,
        options: ["男", "女"]
    },
    {
        id: "q2",
        type: "radio",
        title: "您的年级：",
        required: true,
        options: ["大一", "大二", "大三", "大四", "研究生及以上"]
    },
    {
        id: "q3",
        type: "radio",
        title: "您的专业类别：",
        required: true,
        options: ["文史哲", "经管法", "理工农医", "艺术体育", "其他"]
    },
    {
        id: "q4",
        type: "radio",
        title: "您每月可支配生活费（含家庭给养、兼职收入等）：",
        required: true,
        options: ["1000元以下", "1000-1500元", "1501-2000元", "2001-3000元", "3000元以上"]
    },
    {
        id: "q5",
        type: "radio",
        section: "第二部分：网络消费频率与金额",
        title: "您平均每周进行网络消费（含购物、充值、打赏等）的次数：",
        required: true,
        options: ["几乎不消费", "1-2次", "3-5次", "6-10次", "10次以上"]
    },
    {
        id: "q6",
        type: "radio",
        title: "您每月网络消费总金额大约占可支配生活费的比例：",
        required: true,
        options: ["10%以下", "10%-30%", "31%-50%", "51%-70%", "70%以上"]
    },
    {
        id: "q7",
        type: "radio",
        title: "您单次网络消费的平均金额为：",
        required: true,
        options: ["50元以下", "50-100元", "101-300元", "301-500元", "500元以上"]
    },
    {
        id: "q8",
        type: "radio",
        title: "您在网络消费中，使用分期付款/信用消费（花呗、白条等）的情况：",
        required: true,
        options: ["从不使用", "偶尔使用", "有时使用", "经常使用", "每次都用"]
    },
    {
        id: "q9",
        type: "checkbox",
        section: "第三部分：消费类型与渠道",
        title: "您网络消费的主要类型（可多选）：",
        required: true,
        options: ["服饰鞋帽", "美妆护肤", "餐饮外卖", "数码电子产品", "学习资料/网课", "游戏充值/虚拟物品", "追星/粉丝周边", "盲盒/手办/潮玩", "直播间购物", "打赏/虚拟礼物"],
        hasOther: true
    },
    {
        id: "q10",
        type: "checkbox",
        title: "您最常使用的网络消费平台（可多选）：",
        required: true,
        options: ["淘宝/天猫", "京东", "拼多多", "抖音/快手（直播间购物）", "小红书", "B站（会员购/打赏）", "闲鱼"],
        hasOther: true
    },
    {
        id: "q11",
        type: "radio",
        title: "您是否有过因\u201c喜欢\u201d\u201c心动\u201d而购买非必需品的经历：",
        required: true,
        options: ["从来没有", "很少", "有时", "经常", "总是"]
    },
    {
        id: "q12",
        type: "checkbox",
        section: "第四部分：消费动机与心理机制",
        title: "促使您进行网络消费的主要动机（可多选）：",
        required: true,
        options: ["确实需要，理性购买", "看到喜欢就买，满足即时欲望", "促销/折扣吸引（双十一、618等）", "直播间氛围感染，冲动下单", "社交压力/跟风（同学都有我也要有）", "情绪补偿（心情不好时购物解压）", "追星/为偶像消费", "追求新鲜感/猎奇心理", "收藏/囤积癖好"],
        hasOther: true
    },
    {
        id: "q13",
        type: "radio",
        title: "您在何种情绪状态下更倾向于网络消费：",
        required: true,
        options: ["开心愉悦时", "焦虑压力时", "无聊空虚时", "愤怒沮丧时", "没有明显情绪关联"]
    },
    {
        id: "q14",
        type: "radio",
        title: "您是否有过\u201c直播间冲动消费\u201d的经历（被主播话术或限时优惠驱动购买）：",
        required: true,
        options: ["从来没有", "很少", "有时", "经常", "总是"]
    },
    {
        id: "q15",
        type: "radio",
        title: "您是否有过\u201c粉丝消费\u201d行为（为偶像购买周边、代言产品、打榜等）：",
        required: true,
        options: ["从来没有", "很少", "有时", "经常", "总是"]
    },
    {
        id: "q16",
        type: "radio",
        title: "当您因\u201c喜欢\u201d而购买某件商品后，实际使用/享用的情况如何：",
        required: true,
        options: ["非常频繁使用，物超所值", "偶尔使用", "很少使用", "几乎不用，闲置", "事后后悔购买"]
    },
    {
        id: "q17",
        type: "radio",
        section: "第五部分：消费认知与反思",
        title: "您是否认同\u201c我购买的东西很多是想要而非需要\u201d：",
        required: true,
        options: ["完全不认同", "不太认同", "一般", "比较认同", "非常认同"]
    },
    {
        id: "q18",
        type: "radio",
        title: "您是否曾因网络消费产生经济压力：",
        required: true,
        options: ["从来没有", "偶尔", "有时", "经常", "总是"]
    },
    {
        id: "q19",
        type: "radio",
        title: "您是否有过因网络消费与家人/朋友产生矛盾的经历：",
        required: true,
        options: ["从来没有", "偶尔", "有时", "经常", "总是"]
    },
    {
        id: "q20",
        type: "radio",
        title: "您购买商品时，是否会关注商品的生产者/劳动者的权益（如是否血汗工厂、是否环保等）：",
        required: true,
        options: ["从来不关注", "偶尔关注", "有时关注", "经常关注", "总是关注"]
    },
    {
        id: "q21",
        type: "radio",
        title: "您是否认为自己的网络消费行为受到商家营销策略的较大影响：",
        required: true,
        options: ["完全不受影响", "基本不受影响", "有一定影响", "影响较大", "完全被影响"]
    },
    {
        id: "q22",
        type: "radio",
        title: "您认为商家通过大数据\u201c精准推荐\u201d对您消费行为的影响程度：",
        required: true,
        options: ["完全没有影响", "影响很小", "有一定影响", "影响较大", "影响很大"]
    },
    {
        id: "q23",
        type: "checkbox",
        section: "第六部分：消费与价值观",
        title: "您认为网络消费与以下哪些价值观存在矛盾（可多选）：",
        required: true,
        options: ["勤俭节约的传统美德", "理性思辨的独立判断", "诚实守信的消费信用", "绿色环保的生态理念", "不存在矛盾"]
    },
    {
        id: "q24",
        type: "radio",
        title: "您是否认同\u201c消费能体现个人身份和社交价值\u201d：",
        required: true,
        options: ["完全不认同", "不太认同", "一般", "比较认同", "非常认同"]
    },
    {
        id: "q25",
        type: "radio",
        title: "您是否认同\u201c当今大学生存在消费异化现象（被消费主义裹挟，为消费而消费）\u201d：",
        required: true,
        options: ["完全不认同", "不太认同", "一般", "比较认同", "非常认同"]
    },
    {
        id: "q26",
        type: "checkbox",
        title: "您认为引导大学生理性消费最重要的途径是（可多选）：",
        required: true,
        options: ["加强财商/消费教育", "个人自我反思与自律", "完善平台监管与消费者保护", "家庭经济管理引导", "发挥朋辈互助与社团教育", "国家政策引导（限制过度营销等）"]
    },
    {
        id: "q27",
        type: "textarea",
        section: "第七部分：开放性问题",
        title: "请描述一次令您印象深刻的\u201c因喜欢而买单\u201d的消费经历（包括购买什么、为什么买、买后感受）：",
        required: false,
        placeholder: "请描述您的经历..."
    },
    {
        id: "q28",
        type: "textarea",
        title: "您对当前大学生网络消费环境有何看法或建议？",
        required: false,
        placeholder: "请自由发表您的看法..."
    }
];
