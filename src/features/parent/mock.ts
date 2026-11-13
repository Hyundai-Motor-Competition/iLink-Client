// Figma 와이어프레임에 쓰인 예시 값. 실제 API 연결 전까지 화면에서 사용한다.
export const mock = {
  guardian: { name: '김현대', alias: '엄마' },
  vehicle: { model: '아이오닉 5', modelEn: 'IONIQ 5', plate: '123가 4567' },
  children: [
    {
      id: 1,
      name: '김현우',
      school: '링크고등학교 1학년',
      grade: '중학교 2학년',
      age: 17,
    },
    {
      id: 2,
      name: '김현지',
      school: '링크중학교 2학년',
      grade: '초등학교 4학년',
      age: 15,
    },
  ],
  academies: [
    { name: '대치동수학임팩트 학원', addr: '서울 강남구 테헤란로 12' },
    { name: '대치동수학임팩트 영재반 캠퍼스', addr: '서울 강남구 테헤란로 17' },
    { name: '대치동수학임팩트 목동점', addr: '서울 양천구 목동서로 63' },
    {
      name: '대치동수학임팩트 분당점',
      addr: '경기 성남시 분당구 성남대로 381',
    },
    {
      name: '대치동수학임팩트 서면점',
      addr: '부산 부산진구 중앙대로680번길 23',
    },
  ],
  spots: [
    { name: '대치동수학임팩트 학원', meta: '학원에서 3m | 도보 2분' },
    {
      name: '대치동수학임팩트 학원 건넛편 횡단보도',
      meta: '학원에서 12m | 도보 6분',
    },
  ],
  records: [
    {
      date: '12/15 WED',
      place: '링크중학교 정문',
      time: '16:09 픽업 완료',
      child: '김현지',
    },
    {
      date: '12/15 WED',
      place: '대치동수학임팩트 학원',
      time: '18:12 픽업 완료',
      child: '김현우',
    },
  ],
};

export const KEYWORD = '대치동수학임팩트';
