const axios = require('axios');

/**
 * 너희가 쓰는 "시중 AI"의 HTTP API를 여기에 맞춰 붙이면 됨.
 * 예시는 OpenAI 스타일/Claude 스타일이 아니라 "generic"으로 뺐어.
 */
async function generateChecklist3({ comment, cardStatus, isRequired, context }) {
  const system = `
너는 취업 준비 코치다.
입력된 평가 코멘트(comment)를 바탕으로, 사용자가 "실행 가능한" 개선 체크리스트 3개를 만들어라.
각 항목은 35자~80자 정도, 구체적 행동을 포함하고, 중복 없이 작성한다.
불필요한 서론/번호 말고 JSON 배열만 반환한다.
`;

  const user = `
[상황]
- 카테고리: ${cardStatus}
- 필수조건 여부: ${isRequired ? '필수' : '선택'}
- 코멘트: ${comment}

[추가 컨텍스트]
${context || '(없음)'}

[출력 형식]
["체크리스트1","체크리스트2","체크리스트3"]
`;

  // ✅ 여기서 너희가 쓰는 AI 서비스로 바꿔 끼우면 됨.
  // 예: const url = process.env.LLM_API_URL
  const url = process.env.LLM_API_URL;
  const apiKey = process.env.LLM_API_KEY;

  if (!url || !apiKey) {
    // 개발 중엔 더미로도 굴러가게
    return [
      `${comment} 기반 사례 1개 포트폴리오에 정리하기`,
      `${comment} 관련 미니 프로젝트 1개 만들어보기`,
      `${comment} 근거를 이력서 bullet에 추가하기`,
    ];
  }

  const resp = await axios.post(
    url,
    { system, user },
    { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 30000 }
  );

  // resp.data가 무엇이든 여기서 "배열 3개"로 normalize만 맞춰주면 끝.
  const arr = resp.data?.items || resp.data?.checklists || resp.data;

  if (!Array.isArray(arr) || arr.length !== 3) {
    throw new Error('LLM 응답 형식이 ["", "", ""] 3개가 아님');
  }
  return arr.map(s => String(s).trim()).filter(Boolean);
}

module.exports = { generateChecklist3 };
