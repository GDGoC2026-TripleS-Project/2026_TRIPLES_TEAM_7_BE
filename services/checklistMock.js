// // services/checklistsMock.js
// const mockActiveMap = new Map();

// function buildMockChecklistsResponse(matchId) {
//   const createdAt = new Date('2026-02-08T09:01:00.000Z').toISOString();

//   const base = [
//     { matchResultId: 46, cardStatus: 'STRENGTH', comment: 'React실무 경험' },
//     { matchResultId: 47, cardStatus: 'STRENGTH', comment: '협업 기반 개발 경험' },
//     { matchResultId: 48, cardStatus: 'STRENGTH', comment: '포트폴리오 완성도 높음' },
//     { matchResultId: 49, cardStatus: 'GAP', comment: 'TypeScript 사용경험', isRequired: true },
//     { matchResultId: 50, cardStatus: 'GAP', comment: '테스트 코드 작성 경험', isRequired: false },
//     { matchResultId: 51, cardStatus: 'GAP', comment: '관련 자격증', isRequired: false },
//     { matchResultId: 52, cardStatus: 'RISK', comment: '조건 자체가 리스크' },
//     { matchResultId: 53, cardStatus: 'RISK', comment: '경력 3년이상' },
//     { matchResultId: 54, cardStatus: 'RISK', comment: '복수전공자 우대' },
//   ];

//   const textByComment = {
//     'TypeScript 사용경험': [
//       '기존 JS 프로젝트를 TS로 마이그레이션해보기',
//       '공고에서 자주 쓰는 TS 문법(Generics/Union) 예제를 정리하기',
//       'TS 도입 이유와 효과를 이력서 bullet로 추가하기',
//     ],
//     '테스트 코드 작성 경험': [
//       '핵심 로직 3개에 단위 테스트(Jest) 작성하기',
//       '테스트 커버리지 목표(예: 60%)를 잡고 개선하기',
//       '테스트 전략(단위/통합)을 README에 간단히 정리하기',
//     ],
//     '관련 자격증': [
//       '지원 직무에 맞는 자격증 1~2개 후보를 선정하기',
//       '시험 일정과 준비 계획(주차별)을 작성하기',
//       '학습 결과물(요약 노트)을 포트폴리오에 링크로 추가하기',
//     ],
//   };

//   let checklistIdSeq = 101;

//   const matchResults = base.map((r) => {
//     if (r.cardStatus !== 'GAP') {
//       return { matchResultId: r.matchResultId, cardStatus: r.cardStatus, comment: r.comment };
//     }

//     const texts = textByComment[r.comment] || [
//       `${r.comment} 관련 액션 1`,
//       `${r.comment} 관련 액션 2`,
//       `${r.comment} 관련 액션 3`,
//     ];

//     return {
//       matchResultId: r.matchResultId,
//       cardStatus: r.cardStatus,
//       comment: r.comment,
//       isRequired: r.isRequired,
//       checklists: texts.map((t) => {
//         const id = checklistIdSeq++;
//         return {
//           checklistId: id,
//           checkListText: t,
//           isButtonActive: mockActiveMap.get(id) ?? false,
//         };
//       }),
//     };
//   });

//   return {
//     isSuccess: true,
//     code: 'SUCCESS-200',
//     message: 'OK',
//     data: { matchId, createdAt, matchResults },
//   };
// }

// function toggleMockChecklist(checklistId) {
//   const current = mockActiveMap.get(checklistId) ?? false;
//   const nextValue = !current;
//   mockActiveMap.set(checklistId, nextValue);

//   return {
//     isSuccess: true,
//     code: 'SUCCESS-200',
//     message: 'OK',
//     data: { checklistId, isButtonActive: nextValue },
//   };
// }

// module.exports = { buildMockChecklistsResponse, toggleMockChecklist };
