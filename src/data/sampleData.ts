import { CategoryItem, EduRecord, ExternalLinkItem } from '../types/edufolio';

// Helper to create rich SVG data URLs for realistic lab/certificate/document previews
function svgDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

export const SAMPLE_IMAGES = {
  labSuccess: svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520">
      <defs>
        <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#064e3b"/>
          <stop offset="100%" stop-color="#047857"/>
        </linearGradient>
      </defs>
      <rect width="800" height="520" fill="url(#bg1)" rx="16"/>
      <circle cx="650" cy="110" r="140" fill="#10b981" opacity="0.15"/>
      <rect x="40" y="36" width="170" height="38" rx="19" fill="#10b981"/>
      <text x="125" y="61" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">✓ 실험 성공 (v2.0)</text>
      <g transform="translate(180, 120)">
        <rect x="40" y="40" width="140" height="220" rx="16" fill="#ecfdf5" opacity="0.95"/>
        <rect x="52" y="130" width="116" height="118" rx="10" fill="#34d399"/>
        <circle cx="90" cy="180" r="8" fill="#ffffff" opacity="0.8"/>
        <circle cx="130" cy="160" r="11" fill="#ffffff" opacity="0.8"/>
        <circle cx="110" cy="210" r="6" fill="#ffffff" opacity="0.8"/>
        <text x="110" y="95" text-anchor="middle" fill="#065f46" font-family="sans-serif" font-size="15" font-weight="bold">0.2M NaHCO₃</text>
      </g>
      <g transform="translate(390, 130)">
        <rect x="0" y="20" width="330" height="200" rx="14" fill="#022c22" opacity="0.7" stroke="#34d399" stroke-width="2"/>
        <text x="24" y="58" fill="#6ee7b7" font-family="sans-serif" font-size="17" font-weight="bold">조도 및 농도 보정 후 산소 기포 발생</text>
        <text x="24" y="95" fill="#ecfdf5" font-family="sans-serif" font-size="14">• LED 30W 백색광 거리 15cm 고정</text>
        <text x="24" y="125" fill="#ecfdf5" font-family="sans-serif" font-size="14">• 시금치 디스크 10개 전량 4분 20초 내 부상</text>
        <text x="24" y="155" fill="#ecfdf5" font-family="sans-serif" font-size="14">• MBL 용존산소 센서 기울기 +1.84 mg/L·min</text>
        <text x="24" y="190" fill="#a7f3d0" font-family="sans-serif" font-size="13">촬영: 과학실 2번 실험대 (아이패드 실시간 동기화)</text>
      </g>
      <text x="40" y="470" fill="#d1fae5" font-family="sans-serif" font-size="22" font-weight="bold">광합성 산소 발생 정량 실험 - 최적 조건 확립 사진</text>
    </svg>
  `),
  labFail: svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520">
      <defs>
        <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7f1d1d"/>
          <stop offset="100%" stop-color="#991b1b"/>
        </linearGradient>
      </defs>
      <rect width="800" height="520" fill="url(#bg2)" rx="16"/>
      <rect x="40" y="36" width="195" height="38" rx="19" fill="#f43f5e"/>
      <text x="137" y="61" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">✕ 예비실험 시행착오 (v1.0)</text>
      <g transform="translate(160, 120)">
        <rect x="40" y="40" width="140" height="220" rx="16" fill="#fff1f2" opacity="0.95"/>
        <rect x="52" y="140" width="116" height="108" rx="10" fill="#fda4af"/>
        <rect x="75" y="232" width="70" height="10" rx="5" fill="#15803d"/>
        <text x="110" y="95" text-anchor="middle" fill="#881337" font-family="sans-serif" font-size="14" font-weight="bold">1.0M 과농도 + 백열등</text>
      </g>
      <g transform="translate(380, 130)">
        <rect x="0" y="20" width="350" height="200" rx="14" fill="#450a0a" opacity="0.75" stroke="#fb7185" stroke-width="2"/>
        <text x="24" y="58" fill="#fda4af" font-family="sans-serif" font-size="17" font-weight="bold">시행착오 원인 분석 (1차 예비실험)</text>
        <text x="24" y="95" fill="#ffe4e6" font-family="sans-serif" font-size="14">• 백열전구 발열로 수온이 39°C까지 급상승</text>
        <text x="24" y="125" fill="#ffe4e6" font-family="sans-serif" font-size="14">• 주사기 감압 시 과도한 음압으로 엽육 조직 손상</text>
        <text x="24" y="155" fill="#ffe4e6" font-family="sans-serif" font-size="14">• 15분 경과 후에도 잎 디스크 2개만 부상함</text>
        <text x="24" y="190" fill="#fecdd3" font-family="sans-serif" font-size="13">개선 대책: LED 냉광원 교체 및 농도 0.2M 하향 조정</text>
      </g>
      <text x="40" y="470" fill="#ffe4e6" font-family="sans-serif" font-size="22" font-weight="bold">1차 예비실험 실패 기록 - 수온 상승 및 감압 조건 오류</text>
    </svg>
  `),
  certificate: svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">
      <rect width="800" height="560" fill="#f8fafc" rx="12"/>
      <rect x="28" y="28" width="744" height="504" fill="#ffffff" stroke="#cbd5e1" stroke-width="3" rx="8"/>
      <rect x="42" y="42" width="716" height="476" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-dasharray="6,6" rx="6"/>
      <text x="400" y="110" text-anchor="middle" fill="#1e1b4b" font-family="serif" font-size="34" font-weight="bold">연 수 이 수 증</text>
      <text x="120" y="165" fill="#475569" font-family="sans-serif" font-size="15">제 2026-서울교연-08492 호</text>
      <line x1="120" y1="185" x2="680" y2="185" stroke="#e2e8f0" stroke-width="2"/>
      <text x="130" y="230" fill="#1e293b" font-family="sans-serif" font-size="18" font-weight="bold">연 수 명 : AI·디지털 센서 활용 탐구실험 직무연수</text>
      <text x="130" y="270" fill="#1e293b" font-family="sans-serif" font-size="18">연수기간 : 2026. 10. 12. ~ 2026. 10. 28. (30시간 / 혼합형)</text>
      <text x="130" y="310" fill="#1e293b" font-family="sans-serif" font-size="18">이수성적 : 98점 (이수완료)</text>
      <text x="400" y="385" text-anchor="middle" fill="#334155" font-family="sans-serif" font-size="16">위 사람은 교육공무원법 제38조에 의거하여 소정의 연수 과정을</text>
      <text x="400" y="412" text-anchor="middle" fill="#334155" font-family="sans-serif" font-size="16">성실히 이수하였으므로 이 증서를 수여합니다.</text>
      <text x="400" y="475" text-anchor="middle" fill="#0f172a" font-family="serif" font-size="24" font-weight="bold">서울특별시교육청융합과학교육원장</text>
      <circle cx="575" cy="468" r="28" fill="#ef4444" opacity="0.2" stroke="#dc2626" stroke-width="2"/>
      <text x="575" y="474" text-anchor="middle" fill="#dc2626" font-family="serif" font-size="14" font-weight="bold">직인생략</text>
    </svg>
  `),
  plcPhoto: svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#312e81"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#bg3)" rx="16"/>
      <rect x="45" y="40" width="210" height="36" rx="18" fill="#6366f1"/>
      <text x="150" y="64" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold">교사학습공동체 수업나눔</text>
      <rect x="50" y="105" width="700" height="320" rx="14" fill="#ffffff" opacity="0.1" stroke="#818cf8" stroke-width="1.5"/>
      <text x="85" y="160" fill="#e0e7ff" font-family="sans-serif" font-size="24" font-weight="bold">2026 서술·논술형 탐구 루브릭 공동 개발 워크숍</text>
      <text x="85" y="210" fill="#c7d2fe" font-family="sans-serif" font-size="16">• 일시: 2026. 11. 05 (목) 15:30 ~ 18:00 / 창의융합실험실</text>
      <text x="85" y="245" fill="#c7d2fe" font-family="sans-serif" font-size="16">• 참석: 김과교, 이생물, 박화학, 최물리, 정지구 (5명)</text>
      <text x="85" y="280" fill="#c7d2fe" font-family="sans-serif" font-size="16">• 산출물: 수행평가 AI 피드백 프롬프트 시트 &amp; 학생 실험 보고서 양식</text>
      <rect x="85" y="320" width="280" height="65" rx="10" fill="#4f46e5"/>
      <text x="225" y="358" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold">공동 산출물 3종 첨부 완료</text>
    </svg>
  `),
};

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'training',
    name: '직무·자율 연수',
    icon: 'GraduationCap',
    color: 'indigo',
    description: '직무연수, 자율연수, 핵심 배움 요약, 수업 적용 아이디어 및 이수증 통합 관리',
    isDefault: true,
    templateType: 'training',
    sortOrder: 1,
  },
  {
    id: 'plc',
    name: '교사학습공동체 (교학공)',
    icon: 'Users',
    color: 'emerald',
    description: '교학공 모임 기록, 수업 나눔, 회의록 및 공동 산출물 아카이브',
    isDefault: true,
    templateType: 'plc',
    sortOrder: 2,
  },
  {
    id: 'lab',
    name: '교육자료 개발 (실험 중심)',
    icon: 'FlaskConical',
    color: 'amber',
    description: '예비실험 시행착오 비교, 시약 체크리스트, 버전별(v1.0→v2.0) 실험 자료 개발 타임라인',
    isDefault: true,
    templateType: 'lab',
    sortOrder: 3,
  },
  {
    id: 'contest',
    name: '과학전람회 · 연구대회',
    icon: 'Trophy',
    color: 'rose',
    description: '교원 연구대회, 과학전람회, 에듀테크 선도교사단 등 확장 활동 기록',
    isDefault: false,
    templateType: 'custom',
    sortOrder: 4,
  },
];

export const INITIAL_SAMPLE_RECORDS: EduRecord[] = [
  {
    id: 'rec_lab_photosynthesis_2026',
    categoryId: 'lab',
    title: '광합성 산소 발생 정량 실험 키트 & MBL 센서 활동지 개발',
    date: '2026-11-14',
    year: 2026,
    tags: ['생명과학', '광합성', 'MBL센서', '예비실험완료', '수행평가'],
    summary:
      '기존 백열등+주사기 감압법의 높은 실패율(수온 상승 및 엽육 손상)을 개선하여 LED 냉광원과 0.2M 탄산수소나트륨 최적 조건을 확립한 학생 탐구 실험 자료입니다.',
    pinned: true,
    payload: {
      // Lab fields
      gradeSubject: '고1 통합과학 / 중2 과학',
      unitName: '물질대사와 광합성 (빛의 세기와 이산화탄소 농도)',
      stage: '완성/수업적용',
      hypothesis:
        'LED 냉광원(30W)을 사용하여 수온 변화를 통제하고 NaHCO₃ 농도를 0.2M로 유지하면, 5분 이내에 시금치 잎 디스크 10개가 모두 균일하게 부상할 것이다.',
      materialsChecklist: [
        { id: 'c1', text: '신선한 시금치 잎 & 코르크 보러 (직경 6mm)', checked: true },
        { id: 'c2', text: '0.2M 탄산수소나트륨(NaHCO₃) 수용액 500mL', checked: true },
        { id: 'c3', text: '30W LED 평판 백색 광원 및 조도계', checked: true },
        { id: 'c4', text: '20mL 무바늘 주사기 & 중성세제 1방울(계면활성용)', checked: true },
        { id: 'c5', text: '무선 용존산소(DO) 센서 및 태블릿 미러링 장비', checked: true },
      ],
      procedure:
        '1. 시금치 잎의 굵은 잎맥을 피해 직경 6mm 잎 디스크 10개를 천공한다.\n2. 20mL 주사기에 잎 디스크와 0.2M NaHCO₃ 용액을 넣고 가볍게 2회만 감압하여 가라앉힌다.\n3. 비커에 옮긴 후 LED 광원(거리 15cm, 조도 18,000 lux)을 조사하며 30초 간격으로 부상 개수를 기록한다.\n4. MBL 용존산소 센서로 실시간 산소 발생 기울기를 측정해 그래프를 도출한다.',
      observationsData:
        '• 1차 예비실험(v1.0): 1.0M 수용액 + 백열전구 사용 시 수온이 39°C로 급상승하여 15분 동안 디스크 2개만 부상 (실패)\n• 2차 수정실험(v1.1): LED 광원 교체로 수온 23.5°C 유지 성공, 감압 횟수를 2회로 줄여 잎 가장자리 갈변 현상 해결\n• 최종 본실험(v2.0): 평균 4분 20초 내 10개 디스크 전량 부상, DO 센서 기울기 +1.84 mg/L·min 확인 (6개 모둠 모두 재현 성공!)',
      trialAndErrorNotes:
        '학생들이 주사기 피스톤을 너무 세게 당겨 엽육 세포가 파괴되는 시행착오가 가장 많았음. 주사기 눈금에 실리콘 스토퍼(고무링)를 끼워 5mL 이상 당기지 못하도록 물리적 제한장치를 추가하여 성공률을 95%로 끌어올림.',
      improvementTips:
        '수용액에 중성세제를 이쑤시개 끝으로 살짝만 찍어 넣으면 잎 표면의 소수성 큐티클층 장력이 줄어들어 1회 감압만으로도 즉시 가라앉습니다!',
      safetyNotes:
        '코르크 보러 사용 시 손바닥을 받치지 말고 반드시 고무판 위에서 천공하도록 지도. LED 광원을 맨눈으로 장시간 직시하지 않도록 보안경 또는 차광 가림막 설치.',
      // Placeholders for other union fields
      institution: '',
      hours: 0,
      trainingType: '실습',
      keyLearnings: '',
      classroomIdeas: '',
      groupName: '',
      participants: '',
      topic: '',
      sharedContent: '',
      meetingMinutes: '',
      organizationOrRole: '',
      status: '완성/수업적용',
      keyPoints: '',
      outcomes: '',
    },
    attachments: [
      {
        id: 'att_sample_lab_success',
        name: '광합성_최종실험_성공비교_v2.0.svg',
        originalName: '광합성_최종실험_성공비교_v2.0.svg',
        mimeType: 'image/svg+xml',
        size: 184320,
        storageMode: 'dataurl',
        previewDataUrl: SAMPLE_IMAGES.labSuccess,
        tag: '실험성공',
        uploadedAt: '2026-11-14T14:20:00Z',
      },
      {
        id: 'att_sample_lab_fail',
        name: '1차_예비실험_시행착오_원인분석_v1.0.svg',
        originalName: '1차_예비실험_시행착오_원인분석_v1.0.svg',
        mimeType: 'image/svg+xml',
        size: 162400,
        storageMode: 'dataurl',
        previewDataUrl: SAMPLE_IMAGES.labFail,
        tag: '실험실패',
        uploadedAt: '2026-11-02T16:10:00Z',
      },
    ],
    links: [
      {
        id: 'lnk_1',
        title: 'MBL 광합성 실험 측정 데이터 스프레드시트',
        url: 'https://docs.google.com/spreadsheets/d/example-photosynthesis-data',
        domainType: 'gdrive',
      },
      {
        id: 'lnk_2',
        title: '주사기 감압 시범 실험 1분 쇼츠 영상 (유튜브)',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        domainType: 'youtube',
      },
      {
        id: 'lnk_3',
        title: '학생용 실험 보고서 템플릿 (캔바)',
        url: 'https://www.canva.com/design/example-lab-sheet',
        domainType: 'canva',
      },
    ],
    versionHistory: [
      {
        id: 'ver_2_0',
        version: 'v2.0',
        date: '2026-11-14',
        note: '실리콘 스토퍼 적용 및 2학년 4개 학급 본수업 적용 완료 (학생 활동지 최종본 & 성공 사진 첨부)',
        attachments: [
          {
            id: 'att_ver2_img',
            name: '광합성_최종실험_성공비교_v2.0.svg',
            originalName: '광합성_최종실험_성공비교_v2.0.svg',
            mimeType: 'image/svg+xml',
            size: 184320,
            storageMode: 'dataurl',
            previewDataUrl: SAMPLE_IMAGES.labSuccess,
            tag: '실험성공',
            uploadedAt: '2026-11-14T14:20:00Z',
          },
        ],
        links: [
          {
            id: 'lnk_v2',
            title: 'v2.0 완성형 학생 활동지 Google Drive',
            url: 'https://drive.google.com/drive/folders/example-v2',
            domainType: 'gdrive',
          },
        ],
      },
      {
        id: 'ver_1_1',
        version: 'v1.1',
        date: '2026-11-08',
        note: '광원을 30W LED로 교체하여 수온 상승 문제 해결, NaHCO₃ 농도별(0.1M / 0.2M / 0.5M) 대조군 재실험',
        attachments: [],
        links: [],
      },
      {
        id: 'ver_1_0',
        version: 'v1.0',
        date: '2026-11-02',
        note: '최초 예비실험 설계안 작성 및 1차 예비실험 진행 (백열등 발열 및 감압 과다 시행착오 기록)',
        attachments: [
          {
            id: 'att_ver1_img',
            name: '1차_예비실험_시행착오_원인분석_v1.0.svg',
            originalName: '1차_예비실험_시행착오_원인분석_v1.0.svg',
            mimeType: 'image/svg+xml',
            size: 162400,
            storageMode: 'dataurl',
            previewDataUrl: SAMPLE_IMAGES.labFail,
            tag: '실험실패',
            uploadedAt: '2026-11-02T16:10:00Z',
          },
        ],
        links: [],
      },
    ],
    createdAt: '2026-11-02T09:00:00Z',
    updatedAt: '2026-11-14T15:30:00Z',
  },
  {
    id: 'rec_training_ai_sensor_2026',
    categoryId: 'training',
    title: 'AI·디지털 센서(MBL) 활용 과학 탐구실험 직무연수',
    date: '2026-10-28',
    year: 2026,
    tags: ['직무연수', '디지털탐구', 'MBL', '이수증첨부', '30시간'],
    summary:
      '무선 센서 기반 실시간 데이터 수집과 파이썬/스프레드시트 시각화 기법을 익히고, 수행평가 루브릭에 적용하는 실습형 직무연수 이수 기록입니다.',
    pinned: true,
    payload: {
      institution: '서울특별시교육청융합과학교육원',
      hours: 30,
      trainingType: '혼합',
      keyLearnings:
        '1. 무선 온도·pH·용존산소·광센서를 태블릿과 블루투스로 다중 연결하여 실험 오차를 실시간 검증하는 방법 습득\n2. 실험 실패 데이터도 버리지 않고 오차 원인을 추론하게 하는 "데이터 리터러시 중심 탐구 피드백" 기법\n3. 생성형 AI를 활용한 모둠별 실험 가설 첨삭 챗봇 구성 실습',
      classroomIdeas:
        '2학기 산·염기 중화반응 적정 실험에서 모둠별로 무선 pH 센서와 온도 센서를 동시에 연결해 중화점 그래프를 패들렛에 실시간 공유하고, 급격한 pH 변화 구간을 슬로우 모션 영상과 매칭해 발표하도록 수업 재구성.',
      certificateAttached: true,
      // Placeholders
      groupName: '',
      participants: '',
      topic: '',
      sharedContent: '',
      meetingMinutes: '',
      gradeSubject: '',
      unitName: '',
      stage: '완성/수업적용',
      hypothesis: '',
      materialsChecklist: [],
      procedure: '',
      observationsData: '',
      trialAndErrorNotes: '',
      improvementTips: '',
      safetyNotes: '',
      organizationOrRole: '',
      status: '완성/수업적용',
      keyPoints: '',
      outcomes: '',
    },
    attachments: [
      {
        id: 'att_sample_cert',
        name: '2026_AI디지털센서_직무연수_이수증(30시간).svg',
        originalName: '2026_AI디지털센서_직무연수_이수증(30시간).svg',
        mimeType: 'image/svg+xml',
        size: 142000,
        storageMode: 'dataurl',
        previewDataUrl: SAMPLE_IMAGES.certificate,
        tag: '이수증',
        uploadedAt: '2026-10-28T17:45:00Z',
      },
    ],
    links: [
      {
        id: 'lnk_tr_1',
        title: '연수 실습 노션 아카이브 & 센서 매뉴얼',
        url: 'https://www.notion.so/example-ai-sensor-training',
        domainType: 'notion',
      },
      {
        id: 'lnk_tr_2',
        title: '모둠별 실험 그래프 공유 패들렛 보드',
        url: 'https://padlet.com/example/science-lab-2026',
        domainType: 'padlet',
      },
    ],
    versionHistory: [
      {
        id: 'ver_tr_1',
        version: 'v1.0',
        date: '2026-10-28',
        note: '30시간 연수 이수 완료 및 이수증 스캔본 드래그앤드롭 첨부',
        attachments: [],
        links: [],
      },
    ],
    createdAt: '2026-10-28T17:45:00Z',
    updatedAt: '2026-10-28T18:00:00Z',
  },
  {
    id: 'rec_plc_rubric_2026',
    categoryId: 'plc',
    title: '미래형 과학탐구 교학공 11월 정기 모임 - 실험 설계 루브릭 & AI 피드백 나눔',
    date: '2026-11-05',
    year: 2026,
    tags: ['교학공', '수업나눔', '루브릭개발', '과정중심평가'],
    summary:
      '교내 과학 교사 5인이 모여 학생 주도형 실험 설계 수행평가의 채점 기준표(루브릭)를 고도화하고, 예비실험 시행착오 사례를 공유한 공동 연구 기록입니다.',
    pinned: false,
    payload: {
      groupName: '미래형 디지털 과학탐구 교사학습공동체',
      participants: '김과교(대표), 이생물, 박화학, 최물리, 정지구 (총 5명)',
      topic: '오개념 및 실험 실패 과정을 긍정적으로 평가하는 과정중심 탐구 루브릭 공동 개발',
      sharedContent:
        '• 이생물 교사: 광합성 디스크 부상 실험에서 실패 데이터를 바탕으로 변인을 재통제한 학생 우수 사례 발표\n• 박화학 교사: 마이크로플레이트(SSC)를 활용한 중화반응 소량화 실험 키트 시연 및 시약 폐기물 80% 감축 팁 공유\n• 공동 작업: "가설 설정 - 변인 통제 - 시행착오 분석 - 결론 도출" 4단계 분석적 루브릭 확정',
      meetingMinutes:
        '1. 전월 수업 나눔 성찰 (15:30~16:10): 실험 시간이 부족해 결과 정리가 미흡했던 점을 보완하기 위해 실험 전 사전 시뮬레이션 영상(3분)을 QR코드로 배부하기로 결정.\n2. 공동 지도안 및 활동지 편집 (16:10~17:30): 구글 독스 동시 편집으로 학년별 공통 실험 보고서 양식 통일.\n3. 차기 모임 일정: 12월 3일(목) - 2학기 교학공 최종 성과 발표회 자료집 발간.',
      // Placeholders
      institution: '',
      hours: 0,
      trainingType: '집합',
      keyLearnings: '',
      classroomIdeas: '',
      gradeSubject: '',
      unitName: '',
      stage: '완성/수업적용',
      hypothesis: '',
      materialsChecklist: [],
      procedure: '',
      observationsData: '',
      trialAndErrorNotes: '',
      improvementTips: '',
      safetyNotes: '',
      organizationOrRole: '',
      status: '완성/수업적용',
      keyPoints: '',
      outcomes: '',
    },
    attachments: [
      {
        id: 'att_sample_plc',
        name: '2026_11월_교학공_워크숍_현장카드.svg',
        originalName: '2026_11월_교학공_워크숍_현장카드.svg',
        mimeType: 'image/svg+xml',
        size: 138000,
        storageMode: 'dataurl',
        previewDataUrl: SAMPLE_IMAGES.plcPhoto,
        tag: '활동지',
        uploadedAt: '2026-11-05T18:10:00Z',
      },
    ],
    links: [
      {
        id: 'lnk_plc_1',
        title: '교학공 공동 개발 실험 루브릭 (Google Docs)',
        url: 'https://docs.google.com/document/d/example-plc-rubric',
        domainType: 'gdrive',
      },
      {
        id: 'lnk_plc_2',
        title: '2026 과학 교학공 연간 운영 보드 (Notion)',
        url: 'https://www.notion.so/example-plc-2026',
        domainType: 'notion',
      },
    ],
    versionHistory: [
      {
        id: 'ver_plc_1',
        version: 'v1.0',
        date: '2026-11-05',
        note: '11월 정기 모임 회의록 및 공동 산출물 링크 등록',
        attachments: [],
        links: [],
      },
    ],
    createdAt: '2026-11-05T18:10:00Z',
    updatedAt: '2026-11-05T18:20:00Z',
  },
  {
    id: 'rec_lab_ssc_electrolysis_2026',
    categoryId: 'lab',
    title: 'SSC(소규모 화학) 한천 젤 전기분해 색변화 키트 개발',
    date: '2026-11-16',
    year: 2026,
    tags: ['화학실험', 'SSC실험', '전기분해', '예비실험', '안전실험'],
    summary:
      '페트리 접시와 한천(Agar) 젤에 BTB/페놀프탈레인 지시약을 혼합하여 9V 건전지 하나로 음극과 양극의 산화·환원 색변화를 직관적으로 관찰하는 예비실험 단계 자료입니다.',
    pinned: false,
    payload: {
      gradeSubject: '고2 화학I / 중3 과학',
      unitName: '산화와 환원 / 수용액의 전기분해',
      stage: '예비실험',
      hypothesis:
        '액체 수용액 대신 1.5% 한천 젤 매질을 사용하면 생성된 이온(OH⁻, H⁺)의 확산 속도가 완만해져 양극과 음극 주변의 지시약 색변화 경계선이 뚜렷하게 유지될 것이다.',
      materialsChecklist: [
        { id: 'sc1', text: '한천 가루(Agar) 3g & 증류수 200mL', checked: true },
        { id: 'sc2', text: '0.1M 황산나트륨(Na₂SO₄) 전해질 수용액', checked: true },
        { id: 'sc3', text: 'BTB 용액 및 만능지시약 5mL', checked: true },
        { id: 'sc4', text: '샤프심(탄소 전극 2.0mm) & 9V 건전지 스냅 도선', checked: false },
      ],
      procedure:
        '1. 가열교반기에 증류수와 한천을 녹인 뒤 황산나트륨 전해질과 만능지시약을 넣고 페트리 접시에 굳힌다.\n2. 굳은 한천 젤 양쪽에 샤프심 전극을 3cm 간격으로 꽂고 9V 전원을 연결한다.\n3. 1분, 3분, 5분 경과 시점의 양극(산성-적색)과 음극(염기성-청보라색) 무지개 확산 패턴을 타임랩스로 촬영한다.',
      observationsData:
        '1.5% 한천 농도에서는 젤이 단단하여 기포가 갇히는 장점이 있으나, 샤프심 주변에 산소/수소 기포가 차오르면서 전류가 약해지는 현상 발견. 한천 농도를 1.0%로 낮추는 수정 실험 예정.',
      trialAndErrorNotes:
        '스테인리스 클립을 전극으로 썼더니 양극에서 금속 이온이 녹아나와 녹갈색 침전이 생김 -> 반드시 불활성 탄소 전극(2B 샤프심 2.0mm)을 사용해야 순수한 물의 전기분해 색변화가 관찰됨!',
      improvementTips:
        '페트리 접시 바닥에 흰색 모눈종이(5mm 격자)를 깔고 촬영하면 시간에 따른 이온 이동 거리(mm)를 정량적으로 측정할 수 있습니다.',
      safetyNotes:
        '가열된 한천 용액을 페트리 접시에 부을 때 화상 주의. 황산나트륨 대신 염화나트륨(소금)을 쓰면 독성 염소 기체가 미량 발생할 수 있으므로 반드시 황산나트륨을 사용할 것.',
      institution: '',
      hours: 0,
      trainingType: '실습',
      keyLearnings: '',
      classroomIdeas: '',
      groupName: '',
      participants: '',
      topic: '',
      sharedContent: '',
      meetingMinutes: '',
      organizationOrRole: '',
      status: '예비실험',
      keyPoints: '',
      outcomes: '',
    },
    attachments: [],
    links: [
      {
        id: 'lnk_ssc_1',
        title: 'SSC 한천 전기분해 예비실험 노트 (Notion)',
        url: 'https://www.notion.so/example-ssc-electrolysis',
        domainType: 'notion',
      },
    ],
    versionHistory: [
      {
        id: 'ver_ssc_1',
        version: 'v1.0',
        date: '2026-11-16',
        note: '1.5% 한천 젤 예비실험 1차 테스트 및 탄소 전극 교체 노하우 기록',
        attachments: [],
        links: [],
      },
    ],
    createdAt: '2026-11-16T11:20:00Z',
    updatedAt: '2026-11-16T11:20:00Z',
  },
];

export function detectDomainType(url: string): ExternalLinkItem['domainType'] {
  const lower = url.toLowerCase();
  if (lower.includes('drive.google.com') || lower.includes('docs.google.com')) return 'gdrive';
  if (lower.includes('notion.so') || lower.includes('notion.site')) return 'notion';
  if (lower.includes('canva.com')) return 'canva';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('padlet.com')) return 'padlet';
  if (lower.includes('github.com')) return 'github';
  return 'general';
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
