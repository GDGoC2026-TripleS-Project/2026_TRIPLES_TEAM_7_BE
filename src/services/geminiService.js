const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateChecklists(gapItems) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3-flash-preview", 
    generationConfig: { 
      responseMimeType: "application/json" 
    } 
  });


  const prompt = `
  너는 개발자 커리어 코치다. 아래 GAP 항목마다 실행 가능한 체크리스트 3개를 만든다.

  [반드시 지킬 규칙]
  - 각 GAP당 tasks 3개 (총 = gapItems.length * 3)
  - 각 task는 한국어 1문장, 25~50자 이내
  - 말투는 "~하기 / ~완료하기" 형태로 부드러운 명령형 사용
  - 각 task에는 명확한 완료 기준을 반드시 포함하기
    (예: PR 생성, 커밋 링크, 테스트 통과, 스크린샷 첨부 등)
  - 금지: 추상적 표현(열심히/충분히/익혀보기/완독),
          동기부여 문장,
          설명문,
          코드블록,
          마크다운
  - 결과물로 검증 가능한 행동만 작성
  - 한국어로만 작성

  [입력 데이터]
  ${JSON.stringify(gapItems)}

  [출력 JSON - 이 구조만]
  {
    "results": [
      {
        "matchResultId": 123,
        "tasks": [
          "task1",
          "task2",
          "task3"
        ]
      }
    ]
  }

  JSON 외의 어떤 문자도 출력하지 마라.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API 호출 에러 상세:", error);
    throw error;
  }
}

// ✅ 면접 질문 3개 생성 
async function generateInterviewQuestions(interviewInputs) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
너는 백엔드 개발자 면접관이다. 아래 공고/스택 정보를 바탕으로 면접 질문 3개를 만든다.

[반드시 지킬 규칙]
- 항목은 정확히 3개
- 한국어로만 작성
- questionText: 질문 1문장 (20~60자 권장)
- keywords: 키워드 정확히 2개 (각 2~8자 권장), 예: ["문제 해결","성장성"]
- 키워드는 질문의 의도를 요약하는 단어/짧은 구
- 금지: 번호/불릿/마크다운/코드블록/설명문
- 출력은 JSON만

[입력 데이터]
${JSON.stringify(interviewInputs)}

[출력 JSON - 이 구조만]
{
  "items": [
    { "questionText": "question1", "keywords": ["k1","k2"] },
    { "questionText": "question2", "keywords": ["k1","k2"] },
    { "questionText": "question3", "keywords": ["k1","k2"] }
  ]
}

JSON 외의 어떤 문자도 출력하지 마라.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text());
}

module.exports = { generateChecklists, generateInterviewQuestions };