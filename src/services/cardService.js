const axios = require('axios');
const { job_cards, job_posts, canvas_items, sequelize } = require('../models');

exports.analyzeJob = async (url) => {
    console.log("분석 요청 URL:", url);

  // 🔥 실제 AI 호출 대신 테스트 데이터 반환
    return {
        jobTitle: "소프트웨어 개발",
        companyName: "리네아 정보기술(주)",
        employmentType: ["정규직(수습 2개월)"],
        roleText: ["Python 개발", "데이터 파이프라인"],
        necessaryStack: ["Python", "Java"],
        preferStack: ["정보처리산업기사", "정보처리기사"],
        experienceLevel: ["신입", "경력 2년 이하"],
        salaryText: "회사 내규에 따름",
        workDay: "주 5일",
        locationText: "서울 금천구 가산동 680. 우림라이온스밸리2차 1108호",
        deadlineAt: "2026.02.13"
    };
};



exports.createCard = async({userId, url}) => {

    const t = await sequelize.transaction();

    try {
        
        const site = this.detectJobSource(url)
        
        // 1️⃣ AI 호출 (지금은 로컬 API라고 가정)
        const aiResponse = await axios.post(
        'http://localhost:8080/api/ai/test-job',
        { url }
        );

        const aiData = aiResponse.data;
        
        // 2️⃣ job_posts 저장
        const jobPost = await job_posts.create({
            jobTitle: site,
            originalUrl: url,
        }, { transaction: t });

        // 3️⃣ employmentType 매핑 (ENUM 변환)
        const mapEmploymentType = (text) => {
            if (text.includes('정규직')) return 'FULL_TIME';
            if (text.includes('계약')) return 'CONTRACT';
            if (text.includes('인턴')) return 'INTERN';
            return 'FULL_TIME';
        };

        const lng = 0;
        const lat = 0;

        // 4️⃣ job_cards 저장
        const card = await job_cards.create({
            userId: userId,
            jobPostId: jobPost.id,
            fileUrl: url,
            deadlineAt: aiData.deadlineAt ? new Date(aiData.deadlineAt) : null,
            jobTitle: aiData.jobTitle,
            companyName: aiData.companyName,
            employmentType: mapEmploymentType(aiData.employmentType[0]),
            roleText: aiData.roleText.join(', '),
            necessaryStack: aiData.necessaryStack,
            preferStack: aiData.preferStack,
            salaryText: aiData.salaryText,
            locationText: aiData.locationText,
            experienceLevel: aiData.experienceLevel.join(', '),
            workDay: aiData.workDay,
            addressPoint: {
                type: 'Point',
                coordinates: [lng, lat]
            },
            cardStatus: 'CANVAS',
        }, { transaction: t });

        // 5️⃣ canvas 기본 위치 생성
        await canvas_items.create({
            cardId: card.id,
            canvas_x: 100,
            canvas_y: 100,
        }, { transaction: t });

        await t.commit();

        return {
            cardId: card.id,
            message: '카드 생성 완료',
        };

    } catch (error) {
        await t.rollback();
        throw error;
    }

}

exports.detectJobSource = (url) => {
    if (!url || typeof url !== 'string') {
        throw new Error('유효한 URL이 아닙니다.');
    }

    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('linkareer')) {
        return 'LINKAREER';
    }

    if (lowerUrl.includes('jobkorea')) {
        return 'JOBKOREA';
    }

    if (lowerUrl.includes('wanted')) {
        return 'WANTED';
    }

    return 'UNKNOWN';
};