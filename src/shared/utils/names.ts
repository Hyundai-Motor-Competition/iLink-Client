/** 흔한 한국 성씨 (첫 글자가 이 중 하나일 때만 성으로 본다) */
const SURNAMES = '김이박최정강조윤장임한오서신권황안송류전홍고문양손배백허유남심노하곽성차주우구민진나지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국어은편용예봉경';

/**
 * "김현지" → "현지". 첫 글자가 흔한 성씨가 아니면("테스트") 그대로 둔다.
 * 두 글자 이하 한글 이름이나 영문도 그대로
 */
export function givenName(full: string) {
  const name = full.trim();
  return /^[가-힣]{3,4}$/.test(name) && SURNAMES.includes(name[0]) ? name.slice(1) : name;
}

/** 사진 자리에 쓰는 짧은 이름: 성을 뗀 이름, 세 글자를 넘으면 뒤 두 글자 */
export function shortName(full: string) {
  const g = givenName(full);
  return g.length > 3 ? g.slice(-2) : g;
}
