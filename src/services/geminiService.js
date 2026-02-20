const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateChecklists(gapItems) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
너는 개발자 커리어 코치다. 아래 GAP 항목(총 ${gapItems.length}개)마다:
1) 실행 가능한 체크리스트 tasks 3개
2) 대표 키워드 keyword 1개
를 만든다.

[핵심 목표]
- keyword는 "GAP의 제목"처럼 짧고 명확해야 한다.
- 입력 comment가 문장/설명/부가표현을 포함해도, 핵심만 남겨 정리한다.

[규칙 - tasks]
- 각 GAP당 tasks 정확히 3개
- 각 task는 한국어 1문장, 25~50자
- "~하기 / ~완료하기" 형태
- 완료 기준 포함(커밋/PR/스크린샷/테스트 통과 등)
- 금지: 추상적 표현(열심히/충분히/익혀보기/완독), 설명문, 코드블록, 마크다운

[규칙 - keyword (중요)]
- 각 GAP당 keywords 배열 길이는 정확히 1개 (총합 = ${gapItems.length}개)
- keyword는 2~20자, 한국어/영문 혼용 가능
- keyword는 "comment에서 핵심만 남긴 제목"으로 만든다.
- 아래 정규화 규칙을 반드시 따른다:

[정규화 규칙]
1) comment에 "~이 있으면 더 유리해요", "~이면 유리", "~가 필요", "~경험이 부족" 같은 문장이 붙어 있으면 그 문장 제거하고 핵심 명사구만 남긴다.
   - 예: "TypeScript 사용 경험이 있으면 더 유리해요." -> "TypeScript 사용경험"
2) 공백/조사 차이만 있으면 붙여서 통일:
   - "TypeScript 사용 경험" -> "TypeScript 사용경험"
3) 아래는 치환(정확히 적용):
   - "관련 자격증" / "자격증" / "자격증 보유" -> "자격증"
   - "테스트 코드 작성 경험" / "테스트 경험" -> "테스트 코드"
4) 기술명은 그대로 유지:
   - TypeScript, Jest, Vitest 등은 원문 그대로 가능

[입력]
${JSON.stringify(gapItems)}

[출력 JSON - 이 구조만]
{
  "results": [
    {
      "matchResultId": 123,
      "keywords": ["키워드1개만"],
      "tasks": ["t1","t2","t3"]
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