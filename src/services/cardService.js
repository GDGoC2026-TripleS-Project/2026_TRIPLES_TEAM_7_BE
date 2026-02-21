const axios = require('axios');
const { job_cards, job_posts, canvas_items, sequelize, match_percent } = require('../models');
const convertAndProcessLocation = require('./mapService');

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
        'http://52.78.20.212/fastapi/api/extract',
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

        const location = await convertAndProcessLocation(aiData.locationText);
        
        // if (!location) {
        //     throw new Error('위치 변환 실패');
        // }

        // 배열 → 문자열 변환 헬퍼
        const toText = (val, sep = '\n') =>
            Array.isArray(val) ? val.join(sep) : (val ?? '');

        // employmentType: 배열이면 첫 번째 값만, null이면 기본값
        const rawEmploymentType = Array.isArray(aiData.employmentType)
            ? aiData.employmentType[0]
            : aiData.employmentType;
        const employmentType = mapEmploymentType(rawEmploymentType);

        // 4️⃣ job_cards 저장
        const card = await job_cards.create({
            userId:          userId,
            jobPostId:       jobPost.id,
            fileUrl:         url,
            deadlineAt:      aiData.deadlineAt ? new Date(aiData.deadlineAt) : null,
            jobTitle:        aiData.jobTitle,
            companyName:     aiData.companyName,
            employmentType:  employmentType,
            roleText:        toText(aiData.roleText, '\n'),       // Array → 줄바꿈 join
            necessaryStack:  aiData.necessaryStack ?? [],          // JSON 그대로
            preferStack:     aiData.preferStack ?? [],             // JSON 그대로
            salaryText:      aiData.salaryText ?? null,
            locationText:    aiData.locationText ?? null,
            experienceLevel: toText(aiData.experienceLevel, ', '), // Array → 쉼표 join
            workDay:         aiData.workDay ?? null,
            addressPoint:    location,
            cardStatus:      'CANVAS',
        }, { transaction: t });

        // 5️⃣ canvas 기본 위치 생성
        await canvas_items.create({
            cardId: card.id,
            canvas_x: 692,
            canvas_y: 317,
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

exports.deleteCard = async({userId, cardId}) => {
    return await sequelize.transaction(async (t) => {

        const card = await job_cards.findOne({
            where: { id: cardId, userId },
            transaction: t
        });

        if (!card) {
            throw new Error('삭제 권한이 없거나 카드가 존재하지 않습니다.');
        }

        const post = await job_posts.findByPk(card.jobPostId, {
            transaction: t
        });

        if (post) {
            await post.destroy({ force: true, transaction: t });
        }

        await card.destroy({ force: true, transaction: t });

        return { message: '카드가 성공적으로 삭제되었습니다.', cardId: cardId };
    });
    
}

exports.getCard = async ({ userId, cardId }) => {
    const card = await job_cards.findOne({
        where: { id: cardId, userId }
    });

    if (!card) {
        const error = new Error('카드가 존재하지 않습니다.');
        error.status = 404;
        error.code = 'CARD-404';
        throw error;
    }

    const result = await match_percent.findOne({
        where: { cardId: cardId }
    });

    console.log(result);

    const matchPercent = result.dataValues.matchPercent;
    console.log(matchPercent);


    return {
        id: card.id,
        userId: card.userId,
        jobPostId: card.jobPostId,
        fileUrl: card.fileUrl,
        deadlineAt: card.deadlineAt,
        jobTitle: card.jobTitle,
        companyName: card.companyName,
        employmentType: card.employmentType,
        roleText: card.roleText,
        necessaryStack: card.necessaryStack ?? [],
        preferStack: card.preferStack ?? [],
        salaryText: card.salaryText,
        locationText: card.locationText,
        experienceLevel: card.experienceLevel,
        workDay: card.workDay,
        addressPoint: card.addressPoint
            ? {
                type: card.addressPoint.type,
                coordinates: card.addressPoint.coordinates
            }
            : null,
        cardStatus: card.cardStatus,
        createdAt: card.createdAt,
        matchPercent: matchPercent ? matchPercent : null
    };
};
