// ========== 전역 데이터 저장소 ==========
const appData = {
    schedules: [
        { id: 1, name: '2025-1학기 연구계획서 제출 기간', target: '전체', startDate: '2025-03-01', endDate: '2025-03-15', description: '1학기 연구계획서 제출 마감' },
        { id: 2, name: '2025-1학기 중간논문 제출 기간', target: '교육공학-석사', startDate: '2025-05-01', endDate: '2025-05-31', description: '중간논문 제출 및 심사' }
    ],
    requirements: [
        { id: 1, major: '교육공학', degree: '석사', minCredits: 24, thesisRequired: true, journalPapers: 1, conferencePapers: 0 },
        { id: 2, major: '경영학', degree: '박사', minCredits: 36, thesisRequired: true, journalPapers: 2, conferencePapers: 1 }
    ],
    stages: [
        { 
            id: 1, 
            name: '2025-1학기 교육공학 석사 표준 계획', 
            major: '교육공학', 
            degree: '석사', 
            version: 'v1.0',
            stageCount: 3,
            evaluationCount: 3,
            steps: [
                {
                    id: 1,
                    name: '연구계획서',
                    order: 1,
                    hasEvaluation: true,
                    evaluationCriteriaId: 2,
                    evaluationCriteriaName: '교육공학 특화 평가표'
                },
                {
                    id: 2,
                    name: '중간논문',
                    order: 2,
                    hasEvaluation: true,
                    evaluationCriteriaId: 1,
                    evaluationCriteriaName: '일반 연구계획서 평가표'
                },
                {
                    id: 3,
                    name: '최종논문',
                    order: 3,
                    hasEvaluation: true,
                    evaluationCriteriaId: 3,
                    evaluationCriteriaName: '최종논문 평가표 (상세형)'
                }
            ]
        },
        { 
            id: 2, 
            name: '2025-1학기 경영학 박사 표준 계획', 
            major: '경영학', 
            degree: '박사', 
            version: 'v1.0',
            stageCount: 5,
            evaluationCount: 3,
            steps: [
                {
                    id: 1,
                    name: '연구계획서',
                    order: 1,
                    hasEvaluation: true,
                    evaluationCriteriaId: 1,
                    evaluationCriteriaName: '일반 연구계획서 평가표'
                },
                {
                    id: 2,
                    name: 'IRB 승인',
                    order: 2,
                    hasEvaluation: false,
                    evaluationCriteriaId: null,
                    evaluationCriteriaName: null
                },
                {
                    id: 3,
                    name: '중간논문',
                    order: 3,
                    hasEvaluation: true,
                    evaluationCriteriaId: 1,
                    evaluationCriteriaName: '일반 연구계획서 평가표'
                },
                {
                    id: 4,
                    name: '예비심사',
                    order: 4,
                    hasEvaluation: false,
                    evaluationCriteriaId: null,
                    evaluationCriteriaName: null
                },
                {
                    id: 5,
                    name: '최종논문',
                    order: 5,
                    hasEvaluation: true,
                    evaluationCriteriaId: 3,
                    evaluationCriteriaName: '최종논문 평가표 (상세형)'
                }
            ]
        }
    ],
    types: [
        { id: 1, name: '연구계획서 제출', presentation: false, document: true },
        { id: 2, name: '중간논문 심사', presentation: true, document: true },
        { id: 3, name: 'IRB 승인', presentation: false, document: true },
        { id: 4, name: '예비 심사', presentation: true, document: true },
        { id: 5, name: '최종논문 제출', presentation: true, document: true }
    ],
    evaluationCriteria: [
        { 
            id: 1, 
            name: '석사 논문 평가 기준', 
            type: '석사', 
            evaluationType: 'score',
            items: [
                { name: '연구 주제의 적절성', score: 25 },
                { name: '연구 방법론', score: 25 },
                { name: '결과 분석', score: 25 },
                { name: '논문 작성 완성도', score: 25 }
            ], 
            totalScore: 100 
        },
        { 
            id: 2, 
            name: '박사 논문 평가 기준', 
            type: '박사', 
            evaluationType: 'score',
            items: [
                { name: '연구의 독창성', score: 25 },
                { name: '연구 방법론', score: 20 },
                { name: '학문적 기여도', score: 25 },
                { name: '논문 작성 완성도', score: 20 },
                { name: '발표 능력', score: 10 }
            ], 
            totalScore: 100 
        },
        {
            id: 3,
            name: 'IRB 승인 심사',
            type: '박사',
            evaluationType: 'passfail',
            items: ['연구 윤리 준수', '개인정보 보호 계획', '연구 참여자 동의서', '위험성 평가'],
            totalScore: null
        }
    ],
    
    // 기관계 시스템에서 가져온 논문 제출 요건 목록
    availableRequirements: [
        {
            id: 'req-001',
            name: '최소 학점 이수',
            category: '학점',
            description: '석사 24학점, 박사 36학점 이수',
            details: '전공 필수 및 선택 과목 포함'
        },
        {
            id: 'req-002',
            name: '학술지 논문 게재 (KCI 등재)',
            category: '연구실적',
            description: 'KCI 등재 학술지에 논문 1편 이상 게재',
            details: '제1저자 또는 교신저자로 게재'
        },
        {
            id: 'req-003',
            name: '학술지 논문 게재 (SCOPUS/SCI)',
            category: '연구실적',
            description: 'SCOPUS 또는 SCI(E) 등재 학술지에 논문 1편 이상 게재',
            details: '제1저자 또는 교신저자로 게재'
        },
        {
            id: 'req-004',
            name: '학술대회 발표',
            category: '연구실적',
            description: '국내외 학술대회에서 논문 발표',
            details: '구두 발표 또는 포스터 발표 인정'
        },
        {
            id: 'req-005',
            name: '외국어 시험 통과',
            category: '어학',
            description: 'TOEIC 700점 이상 또는 이에 준하는 성적',
            details: 'TOEFL, TEPS, OPIC 등 인정'
        },
        {
            id: 'req-006',
            name: '종합시험 합격',
            category: '시험',
            description: '전공 종합시험 합격',
            details: '필기시험 또는 구술시험'
        },
        {
            id: 'req-007',
            name: '연구윤리교육 이수',
            category: '교육',
            description: '연구윤리 온라인 교육 이수',
            details: '매 학기 1회 이상 이수'
        },
        {
            id: 'req-008',
            name: 'IRB 승인',
            category: '연구윤리',
            description: '인간 대상 연구 시 IRB 승인 필수',
            details: '연구 시작 전 승인 완료 필요'
        }
    ],
    submissions: {
        researchProposal: [
            { 
                id: 1, 
                studentName: '김철수', 
                studentId: '2024001', 
                major: '교육공학', 
                degree: '석사', 
                advisor: '홍길동', 
                submitDate: '2025-03-10',
                thesisTitle: '인공지능 활용 교육 플랫폼의 효과성 연구',
                researchPurpose: '인공지능 기술을 활용한 맞춤형 학습 플랫폼이 학습자의 학업 성취도와 학습 동기에 미치는 영향을 실증적으로 분석하고자 함',
                researchMethod: '실험 연구 (실험집단 30명, 통제집단 30명), 사전-사후 검사 설계',
                expectedResults: '인공지능 활용 그룹이 전통적 학습 그룹 대비 학업 성취도 15% 향상 예상',
                status: '승인대기', 
                fileUrl: '#',
                fileName: '2024001_김철수_연구계획서.pdf'
            },
            { 
                id: 2, 
                studentName: '이영희', 
                studentId: '2024002', 
                major: '경영학', 
                degree: '박사', 
                advisor: '박교수', 
                submitDate: '2025-03-12',
                thesisTitle: 'ESG 경영이 기업 가치에 미치는 영향: 한국 코스피 상장 기업을 중심으로',
                researchPurpose: '기업의 ESG 경영 활동이 재무적 성과 및 기업 가치에 미치는 영향을 실증 분석',
                researchMethod: '패널 데이터 분석 (2018-2023년, 200개 기업), 회귀분석 및 매개효과 분석',
                expectedResults: 'ESG 점수와 기업 가치 간 정(+)의 상관관계 검증 예상',
                status: '승인완료', 
                fileUrl: '#',
                fileName: '2024002_이영희_연구계획서.pdf',
                approvalDate: '2025-03-15',
                reviewComment: '연구 주제와 방법론이 명확하여 승인합니다. IRB 승인 절차를 진행해주세요.'
            }
        ],
        thesisPlan: [
            { 
                id: 1, 
                studentName: '박민수', 
                studentId: '2023005', 
                major: '교육공학', 
                degree: '석사', 
                advisor: '홍길동', 
                submitDate: '2025-04-05',
                thesisTitle: '메타버스 기반 협력학습이 문제해결력에 미치는 영향',
                chapter1: '연구의 필요성 및 목적',
                chapter2: '이론적 배경 (메타버스 교육, 협력학습, 문제해결력)',
                chapter3: '연구 방법 (혼합 연구 설계)',
                chapter4: '연구 결과 예상',
                chapter5: '결론 및 제언',
                schedule: '1학기: 1-2장 작성, 여름방학: 3장 작성 및 데이터 수집, 2학기: 4-5장 작성',
                status: '검토중', 
                fileUrl: '#',
                fileName: '2023005_박민수_논문작성계획서.pdf'
            }
        ],
        midThesis: [
            { 
                id: 1, 
                studentName: '최지연', 
                studentId: '2023010', 
                major: '경영학', 
                degree: '석사', 
                advisor: '박교수', 
                submitDate: '2025-05-15',
                thesisTitle: '소셜미디어 마케팅이 브랜드 충성도에 미치는 영향',
                totalPages: 85,
                copyKiller: 92,
                copyKillerDetail: '전체 유사도 8%, 인용 처리 적절',
                gptKiller: 88,
                gptKillerDetail: 'AI 생성 의심 구간 12%, 추가 검토 필요',
                status: '심사중', 
                fileUrl: '#',
                fileName: '2023010_최지연_중간논문.pdf',
                reviewers: [
                    { name: '박교수', role: '지도교수', status: '검토중' },
                    { name: '김교수', role: '심사위원', status: '대기' },
                    { name: '이교수', role: '심사위원', status: '대기' }
                ]
            }
        ],
        finalThesis: [
            { 
                id: 1, 
                studentName: '정태훈', 
                studentId: '2022008', 
                major: '교육공학', 
                degree: '박사', 
                advisor: '홍길동', 
                submitDate: '2025-06-10',
                thesisTitle: '학습분석학을 활용한 적응형 학습 시스템 설계 및 효과성 검증',
                totalPages: 248,
                copyKiller: 95,
                copyKillerDetail: '전체 유사도 5%, 모든 인용 적절',
                gptKiller: 90,
                gptKillerDetail: 'AI 생성 의심 구간 없음',
                status: '심사완료',
                result: '합격',
                finalScore: 92,
                defenseDate: '2025-06-20',
                fileUrl: '#',
                fileName: '2022008_정태훈_최종논문.pdf',
                reviewers: [
                    { name: '홍길동', role: '지도교수', score: 94, comment: '학문적 기여도가 높은 우수한 연구입니다.' },
                    { name: '최교수', role: '심사위원', score: 91, comment: '연구 방법론이 탁월합니다.' },
                    { name: '강교수', role: '심사위원', score: 90, comment: '실용적 시사점이 명확합니다.' }
                ]
            }
        ],
        journalSubmission: [
            { 
                id: 1, 
                studentName: '김민지', 
                studentId: '2023012', 
                major: '경영학', 
                degree: '박사', 
                journalName: 'Journal of Business Research',
                paperTitle: 'The Impact of Corporate Social Responsibility on Consumer Trust in the Digital Age',
                publishDate: '2025-03',
                publishYear: '2025',
                volume: '168',
                pages: '45-58',
                doi: '10.1016/j.jbusres.2024.114523',
                isFirstAuthor: true,
                coAuthors: 'Park, J., Lee, S.',
                kci: true,
                scopus: true,
                sci: false,
                impactFactor: 3.78,
                abstractKor: '디지털 시대에 기업의 사회적 책임 활동이 소비자 신뢰에 미치는 영향을 실증 분석한 연구...',
                abstractEng: 'This study empirically analyzes the impact of corporate social responsibility on consumer trust in the digital age...',
                keywords: '기업의 사회적 책임, 소비자 신뢰, 디지털 마케팅',
                status: '심사중',
                proofUrl: '#',
                paperUrl: '#'
            }
        ]
    },
    // ========== 논문지도 진행 현황 (PDF 피드백 조회) ==========
    guidanceProgress: [
        {
            id: 1,
            studentId: '2024001',
            studentName: '김철수',
            major: '교육공학',
            degree: '석사',
            advisor: '홍길동',
            documentTitle: '최종본 재검토 요청',
            fileName: '논문_최종본_김철수_v3.pdf',
            fileUrl: '/files/feedback/doc-kim-final-v3.pdf',
            submitDate: '2025-11-25',
            stage: '최종본',
            copyKiller: 7,
            gptKiller: 1,
            feedbackStatus: '답변 대기중',
            feedbackCount: 3,
            lastFeedbackDate: '2025-11-26'
        },
        {
            id: 2,
            studentId: '2024001',
            studentName: '김철수',
            major: '교육공학',
            degree: '석사',
            advisor: '홍길동',
            documentTitle: '최종본 2차 검토 요청',
            fileName: '논문_최종본_김철수_v2.pdf',
            fileUrl: '/files/feedback/doc-kim-final-v2.pdf',
            submitDate: '2025-11-20',
            stage: '최종본',
            copyKiller: 8,
            gptKiller: 1,
            feedbackStatus: '피드백 완료',
            feedbackCount: 2,
            lastFeedbackDate: '2025-11-21'
        },
        {
            id: 3,
            studentId: '2024002',
            studentName: '이영희',
            major: '경영학',
            degree: '박사',
            advisor: '최교수',
            documentTitle: '4장 결과 및 논의 검토 요청',
            fileName: '4장_결과논의_이영희.pdf',
            fileUrl: '/files/feedback/doc-lee-chap4.pdf',
            submitDate: '2025-11-18',
            stage: '중간논문',
            copyKiller: 15,
            gptKiller: 3,
            feedbackStatus: '피드백 완료',
            feedbackCount: 1,
            lastFeedbackDate: '2025-11-19'
        },
        {
            id: 4,
            studentId: '2024003',
            studentName: '홍길동',
            major: '컴퓨터공학',
            degree: '석사',
            advisor: '박교수',
            documentTitle: '연구계획서 초안 검토',
            fileName: '연구계획서_홍길동_v1.pdf',
            fileUrl: '/files/feedback/doc-hong-proposal.pdf',
            submitDate: '2025-11-22',
            stage: '연구계획서',
            copyKiller: 5,
            gptKiller: 2,
            feedbackStatus: '답변 대기중',
            feedbackCount: 0,
            lastFeedbackDate: null
        },
        {
            id: 5,
            studentId: '2024002',
            studentName: '이영희',
            major: '경영학',
            degree: '박사',
            advisor: '최교수',
            documentTitle: '3장 연구방법 검토 요청',
            fileName: '3장_연구방법_이영희.pdf',
            fileUrl: '/files/feedback/doc-lee-chap3.pdf',
            submitDate: '2025-11-15',
            stage: '중간논문',
            copyKiller: 12,
            gptKiller: 2,
            feedbackStatus: '피드백 완료',
            feedbackCount: 2,
            lastFeedbackDate: '2025-11-16'
        }
    ],
    
    // ========== 주차별 논문지도 현황 ==========
    weeklyGuidanceStudents: [
        {
            id: 1,
            studentId: '2024001',
            studentName: '김철수',
            major: '교육공학',
            degree: '석사',
            advisors: ['홍길동', '박교수'],
            guidanceCount: 5,
            lastGuidanceDate: '2025-03-15'
        },
        {
            id: 2,
            studentId: '2024002',
            studentName: '이영희',
            major: '경영학',
            degree: '박사',
            advisors: ['최교수'],
            guidanceCount: 3,
            lastGuidanceDate: '2025-03-10'
        },
        {
            id: 3,
            studentId: '2024003',
            studentName: '홍길동',
            major: '컴퓨터공학',
            degree: '석사',
            advisors: ['박교수', '김교수'],
            guidanceCount: 0,
            lastGuidanceDate: null
        }
    ],
    
    guidanceRecords: [
        // 김철수 (2024001) 지도 내역
        {
            id: 1,
            studentId: '2024001',
            week: 1,
            date: '2025-03-01',
            advisor: '홍길동',
            topic: '연구방법론 개요',
            content: '질적연구와 양적연구의 차이점 설명, 연구 주제에 적합한 방법론 논의',
            method: '대면',
            professorComment: '연구 방향 잘 설정됨. 다음 주까지 선행연구 5편 이상 검토 필요'
        },
        {
            id: 2,
            studentId: '2024001',
            week: 2,
            date: '2025-03-08',
            advisor: '박교수',
            topic: '문헌검토 방법',
            content: '선행연구 검색 방법, 데이터베이스 활용법, 문헌 정리 방법 안내',
            method: '비대면',
            professorComment: '검색 키워드 재설정 필요. 국외 문헌도 포함하여 검토'
        },
        {
            id: 3,
            studentId: '2024001',
            week: 3,
            date: '2025-03-15',
            advisor: '홍길동',
            topic: '연구설계 검토',
            content: '연구 대상, 표본 크기, 자료 수집 방법 등 연구설계 전반 검토',
            method: '대면',
            professorComment: '연구설계 적절함. IRB 신청 준비 시작'
        },
        {
            id: 4,
            studentId: '2024001',
            week: 4,
            date: '2025-03-22',
            advisor: '박교수',
            topic: 'IRB 신청서 작성',
            content: 'IRB 신청서 작성 요령, 연구 윤리 관련 주의사항 안내',
            method: '이메일',
            professorComment: 'IRB 신청서 초안 검토 완료. 일부 수정 후 제출'
        },
        {
            id: 5,
            studentId: '2024001',
            week: 5,
            date: '2025-03-29',
            advisor: '홍길동',
            topic: '연구계획서 최종 검토',
            content: '연구계획서 전체 내용 최종 점검, 형식 및 내용 보완',
            method: '대면',
            professorComment: '연구계획서 승인 가능 수준. 다음 주 제출'
        },
        
        // 이영희 (2024002) 지도 내역
        {
            id: 6,
            studentId: '2024002',
            week: 1,
            date: '2025-03-05',
            advisor: '최교수',
            topic: '박사논문 주제 선정',
            content: '관심 연구 주제 논의, 선행연구 동향 파악, 연구 가능성 검토',
            method: '대면',
            professorComment: '주제 범위 좁히기 필요. 구체적인 연구문제 도출'
        },
        {
            id: 7,
            studentId: '2024002',
            week: 2,
            date: '2025-03-12',
            advisor: '최교수',
            topic: '이론적 배경 구성',
            content: '주요 이론 검토, 개념적 틀 구성, 변인 간 관계 설정',
            method: '비대면',
            professorComment: '이론적 기반 탄탄함. 변인 측정 도구 선정 시작'
        },
        {
            id: 8,
            studentId: '2024002',
            week: 4,
            date: '2025-03-26',
            advisor: '최교수',
            topic: '연구 도구 개발',
            content: '설문지 초안 작성, 타당도 및 신뢰도 확보 방안 논의',
            method: '대면',
            professorComment: '설문 문항 일부 수정 필요. 예비조사 준비'
        }
    ],
    
    // ========== 평가 기준 관리 (독립적 평가표) ==========
    evaluationCriteria: [
        {
            id: 1,
            name: '일반 연구계획서 평가표',
            description: '범용 연구계획서 평가 기준 (모든 학과 적용 가능)',
            itemCount: 5,
            totalScore: 100,
            createdDate: '2025-01-10',
            items: [
                {
                    id: 1,
                    name: '연구주제 적절성',
                    score: 20,
                    description: '연구 주제의 명확성 및 타당성'
                },
                {
                    id: 2,
                    name: '연구방법 타당성',
                    score: 30,
                    description: '연구 방법론의 적절성 및 실현가능성'
                },
                {
                    id: 3,
                    name: '선행연구 검토',
                    score: 20,
                    description: '관련 문헌 검토의 충실성'
                },
                {
                    id: 4,
                    name: '연구계획 실현성',
                    score: 15,
                    description: '연구 수행의 현실적 가능성'
                },
                {
                    id: 5,
                    name: '형식 및 체계',
                    score: 15,
                    description: '연구계획서의 형식적 완성도'
                }
            ]
        },
        {
            id: 2,
            name: '교육공학 특화 평가표',
            description: '교육공학 전공 심화 평가 (교수설계 이론 포함)',
            itemCount: 6,
            totalScore: 100,
            createdDate: '2025-01-15',
            items: [
                {
                    id: 1,
                    name: '연구주제 적절성',
                    score: 15,
                    description: '교육공학 분야 연구 주제의 명확성'
                },
                {
                    id: 2,
                    name: '교수설계 이론 적용',
                    score: 25,
                    description: '교수설계 이론의 적절한 적용'
                },
                {
                    id: 3,
                    name: '연구방법 타당성',
                    score: 20,
                    description: '연구 방법론의 적절성'
                },
                {
                    id: 4,
                    name: '교육적 효과성',
                    score: 20,
                    description: '교육 현장 적용 가능성'
                },
                {
                    id: 5,
                    name: '선행연구 검토',
                    score: 10,
                    description: '교육공학 분야 선행연구 분석'
                },
                {
                    id: 6,
                    name: '형식 및 체계',
                    score: 10,
                    description: '논문의 형식적 완성도'
                }
            ]
        },
        {
            id: 3,
            name: '최종논문 평가표 (상세형)',
            description: '최종논문용 상세 평가 (10개 항목)',
            itemCount: 10,
            totalScore: 100,
            createdDate: '2025-01-20',
            items: [
                {
                    id: 1,
                    name: '연구문제 명확성',
                    score: 10,
                    description: '연구문제의 명확한 제시'
                },
                {
                    id: 2,
                    name: '이론적 배경',
                    score: 10,
                    description: '이론적 기반의 충실성'
                },
                {
                    id: 3,
                    name: '연구방법 적절성',
                    score: 10,
                    description: '연구 방법의 타당성'
                },
                {
                    id: 4,
                    name: '자료 수집',
                    score: 10,
                    description: '자료 수집의 적절성'
                },
                {
                    id: 5,
                    name: '자료 분석',
                    score: 10,
                    description: '자료 분석의 정확성'
                },
                {
                    id: 6,
                    name: '연구 결과',
                    score: 10,
                    description: '연구 결과의 명확한 제시'
                },
                {
                    id: 7,
                    name: '논의 및 해석',
                    score: 10,
                    description: '결과에 대한 논의의 깊이'
                },
                {
                    id: 8,
                    name: '연구의 의의',
                    score: 10,
                    description: '학문적/실무적 기여도'
                },
                {
                    id: 9,
                    name: '형식 및 체계',
                    score: 10,
                    description: '논문의 형식적 완성도'
                },
                {
                    id: 10,
                    name: '연구 윤리',
                    score: 10,
                    description: '연구 윤리 준수'
                }
            ]
        }
    ],
};

