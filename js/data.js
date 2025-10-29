// (주의) 이 파일은 UTF-8 형식으로 저장되어야 한글이 깨지지 않습니다.
// 메모장에서 저장 시 '인코딩'을 'UTF-8'로 설정하세요.

const professorData = {
    // 1. 프로필 (from ver.1.995)
    profile: { name: '박한양', id: '20100001', department: '교육공학 전공' },

    // 2. 지도 학생 (from ver.1.996 - 필드 확장됨)
    students: [
        { 
            id: 'std-01', 
            name: '김한양', 
            studentId: '202312345', // (ver.1.996)
            degree: '석사',           // (ver.1.996)
            major: '교육공학', 
            currentStage: 9, 
            lastActivity: '3일 전, 3장 초안 제출', 
            plans: [
                { session: 1, topic: "연구 주제 구체화", date: "2025-09-05", method: "대면미팅" }, 
                { session: 2, topic: "연구 계획서 초안 작성", date: "2025-09-19", method: "온라인 피드백" }
            ], 
            phone: '010-1234-5678', // (ver.1.996)
            email: 'kim.hanyang@hycu.ac.kr' // (ver.1.996)
        },
        { 
            id: 'std-02', 
            name: '이연구', 
            studentId: '202254321', // (ver.1.996)
            degree: '박사',           // (ver.1.996)
            major: '상담심리학', 
            currentStage: 6, 
            lastActivity: '1일 전, 지도 예약 신청', 
            plans: [
                { session: 1, topic: "연구 주제 선정", date: "2025-09-08", method: "화상미팅" }
            ], 
            phone: '010-8765-4321', // (ver.1.996)
            email: 'lee.research@hycu.ac.kr' // (ver.1.996)
        },
        { 
            id: 'std-03', 
            name: '최논문', 
            studentId: '202312346', // (ver.1.996)
            degree: '석사',           // (ver.1.996)
            major: '교육공학', 
            currentStage: 5, 
            lastActivity: '1주 전, 연구계획서 승인', 
            plans: [], 
            phone: '010-9988-7766', // (ver.1.996)
            email: 'choi.thesis@hycu.ac.kr' // (ver.1.996)
        },
    ],

    // 3. 온라인 피드백 요청 (from ver.1.25 - 고도화된 버전)
    feedbackRequests: [
        { id: 'fb-010', documentId: 'doc-kim-final', version: 3, studentId: 'std-01', studentName: '김한양', title: '최종본 재수정 요청', date: '2025-11-25', file: '논문_최종본_김한양_v3.pdf', stage: '최종본', copykillerScore: '7%', gptkillerScore: '1%', status: '답변 대기중' },
        { id: 'fb-006', documentId: 'doc-kim-final', version: 2, studentId: 'std-01', studentName: '김한양', title: '최종본 2차 검토 요청', date: '2025-11-20', file: '논문_최종본_김한양_v2.pdf', stage: '최종본', copykillerScore: '8%', gptkillerScore: '1%', status: '피드백 완료' },
        { id: 'fb-001', documentId: 'doc-kim-final', version: 1, studentId: 'std-01', studentName: '김한양', title: '최종본 1차 검토 요청', date: '2025-11-12', file: '논문_최종본_김한양_v1.pdf', stage: '최종본', copykillerScore: '12%', gptkillerScore: '2%', status: '피드백 완료' },
        { id: 'fb-009', documentId: 'doc-lee-chap4', version: 1, studentId: 'std-02', studentName: '이연구', title: '4장 결과 및 논의 검토 요청', date: '2025-11-18', file: '4장_결과논의.pdf', stage: '4장 결과', copykillerScore: '15%', gptkillerScore: '3%', status: '피드백 완료' },
        
        // (ver.1.995의 다른 데이터 추가 - documentId, version 임의 부여)
        { id: 'fb-008', documentId: 'doc-choi-chap3', version: 1, studentId: 'std-03', studentName: '최논문', title: '3장 방법론 수정본 검토', date: '2025-11-15', file: '3장_방법론_수정1.pdf', stage: '3장 방법론', copykillerScore: '9%', gptkillerScore: '6%', status: '피드백 완료' }, 
        { id: 'fb-007', documentId: 'doc-kim-chap3', version: 1, studentId: 'std-01', studentName: '김한양', title: '3장 방법론 초안 검토 요청', date: '2025-11-05', file: '3장_방법론.pdf', stage: '3장 방법론', copykillerScore: '12%', gptkillerScore: '8%', status: '피드백 완료' }, 
        { id: 'fb-005', documentId: 'doc-kim-chap1', version: 1, studentId: 'std-01', studentName: '김한양', title: '1장 서론 검토 요청', date: '2025-10-25', file: '1장_서론.pdf', stage: '1장 서론', copykillerScore: '7%', gptkillerScore: '4%', status: '피드백 완료' }, 
        { id: 'fb-004', documentId: 'doc-choi-plan', version: 1, studentId: 'std-03', studentName: '최논문', title: '연구계획서 수정본 검토 요청', date: '2025-10-11', file: '연구계획서_최논문_v2.pdf', stage: '연구계획서', copykillerScore: '4%', gptkillerScore: '0%', status: '피드백 완료' }, 
        { id: 'fb-003', documentId: 'doc-lee-chap2', version: 1, studentId: 'std-02', studentName: '이연구', title: '2장 이론적 배경 초안', date: '2025-09-30', file: '2장_이론적배경.pdf', stage: '2장 이론', copykillerScore: '18%', gptkillerScore: '11%', status: '피드백 완료' }, 
        { id: 'fb-002', documentId: 'doc-kim-plan', version: 1, studentId: 'std-01', studentName: '김한양', title: '연구계획서 초안 검토 요청', date: '2025-09-15', file: '연구계획서_김한양.pdf', stage: '연구계획서', copykillerScore: '6%', gptkillerScore: '2%', status: '피드백 완료' }, 
    ],

    // 4. 피드백 상세 데이터 (from ver.1.25 - 고도화된 버전)
    feedbackAnnotations: { 
        "fb-010": { 
            generalFeedbackThread: [], 
            annotations: {
                "3": [{ "type": "path", "customType": "drawing", "id": "anno-1729004515591", "originX": "left", "originY": "top", "left": 169.5, "top": 288, "width": 261, "height": 61, "fill": null, "stroke": "rgba(220, 38, 38, 0.9)", "strokeWidth": 2, "path": [["M", 169.5, 289], ["L", 430.5, 349], ["M", 169.5, 349], ["L", 430.5, 289]]}]
            }
        },
        "fb-006": { 
            generalFeedbackThread: [
                { id: "gf-fb006-1", author: "박교수", text: "피드백 반영된 것 확인했습니다. 일부 어색한 문장들 수정해주세요.", timestamp: "2025-11-21 09:30", attachments: [{fileName: "수정가이드.docx", fileUrl: "#"}] },
                { id: "gf-fb006-2", author: "김한양", text: "네 교수님, 지적해주신 문장들 다시 다듬어 보겠습니다. 첨부해주신 가이드 감사합니다!", timestamp: "2025-11-21 13:45", attachments: [] }
            ],
            annotations: {
                "1": [{ type: "rect", left: 100, top: 150, width: 200, height: 50, fill: "rgba(106, 0, 40, 0.1)", stroke: "rgba(106, 0, 40, 0.8)", strokeWidth: 2, customType: "comment", id: "anno-fb006-1",
                    comments: [
                        { id: "cm-fb006-1-1", author: "박교수", text: "이 부분 표현이 모호합니다. 더 명확한 단어를 사용하세요.", timestamp: "2025-11-21 09:32", attachments: [] },
                        { id: "cm-fb006-1-2", author: "김한양", text: "확인했습니다. 수정하겠습니다.", timestamp: "2025-11-21 13:46", attachments: [] }
                    ],
                    linkedComments: ["anno-fb006-2"],
                    commentAudio: null
                },
                { type: "rect", left: 350, top: 250, width: 150, height: 50, fill: "rgba(106, 0, 40, 0.1)", stroke: "rgba(106, 0, 40, 0.8)", strokeWidth: 2, customType: "comment", id: "anno-fb006-2",
                    comments: [
                        { id: "cm-fb006-2-1", author: "박교수", text: "이 부분도 함께 확인 바랍니다.", timestamp: "2025-11-21 09:33", attachments: [] }
                    ],
                    linkedComments: ["anno-fb006-1"],
                    commentAudio: null
                }
                ]
            }
        },
        "fb-001": { 
            generalFeedbackThread: [{ id: "gf-fb001-1", author: "박교수", text: "1차 피드백입니다. 참고문헌 형식을 통일할 필요가 있습니다.", timestamp: "2025-11-13 11:00", attachments: [] }],
            annotations: {}
        },
        "fb-009": {
            generalFeedbackThread: [{ id: "gf-fb009-1", author: "박교수", text: "전반적인 내용 검토 완료했습니다.", timestamp: "2025-11-19 15:20", attachments: [] }],
            annotations: { "1": [ { type: "path", customType: "highlight", id: "anno-fb009-1", originX: "left", originY: "top", left: 250.84, top: 434.33, width: 200.7, height: 14.5, fill: null, stroke: "rgba(255, 255, 0, 0.4)", strokeWidth: 15 }] }
        },
        
        // (ver.1.995의 나머지 데이터에 대한 기본 구조)
        "fb-008": { generalFeedbackThread: [], annotations: {} },
        "fb-007": { generalFeedbackThread: [], annotations: {} },
        "fb-005": { generalFeedbackThread: [], annotations: {} },
        "fb-004": { generalFeedbackThread: [], annotations: {} },
        "fb-003": { generalFeedbackThread: [], annotations: {} },
        "fb-002": { generalFeedbackThread: [], annotations: {} },
    },
    
    // 5. 랩미팅 (from ver.1.995)
    meetings: [
        { id: 'm-011', studentId: 'std-02', studentName: '이연구', date: '2025-08-22', time: '14:00', type: '화상미팅', status: '예약', summary: '연구 계획서 수정본 검토 예정', zoomUrl: 'https://hanyang-ac-kr.zoom.us/j/1234567890' }, 
        { id: 'm-012', studentId: 'std-01', studentName: '김한양', date: '2025-08-25', time: '15:00', type: '대면미팅', status: '예약', summary: '3장 방법론 피드백 및 향후 일정 논의' }, 
        { id: 'm-010', studentId: 'std-01', studentName: '김한양', date: '2025-08-18', time: '15:00', type: '대면미팅', status: '완료', summary: '연구 방향성에 대해 논의하고 주제를 좀 더 구체화하기로 함.' }, 
        { id: 'm-009', studentId: 'std-02', studentName: '이연구', date: '2025-08-15', time: '11:00', type: '화상미팅', status: '완료', summary: '연구계획서 초안의 논리적 흐름 검토. 참고문헌 보강 필요.', recordingUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }, // 샘플 영상 URL 추가
        { id: 'm-008', studentId: 'std-03', studentName: '최논문', date: '2025-08-11', time: '16:00', type: '대면미팅', status: '완료', summary: '연구 윤리 교육 이수 확인 및 연구 진행 상황 점검.' }
    ],
    
    // 6. 자주 쓰는 코멘트 (from ver.1.25)
    quickMarks: [
        { id: 'qm-01', title: '근거 제시 필요', content: '주장에 대한 명확한 근거를 제시해 주세요. 관련 연구나 데이터를 인용하면 논리가 강화됩니다.' }, 
        { id: 'qm-02', title: '문단 구분', content: '내용의 흐름에 맞게 문단을 나누어 가독성을 높일 필요가 있습니다.' }, 
        { id: 'qm-03', title: '오탈자 확인', content: '오탈자가 보입니다. 제출 전 전체적으로 다시 한번 확인해 주세요.' }, 
        { id: 'qm-04', title: '두괄식 구성', content: '문단의 핵심 내용을 첫 문장에 제시하는 두괄식으로 구성하면 전달력이 높아집니다.' }
    ],
    
    // 7. 워크플로우 (from ver.1.995)
    workflow: [
        { id: 0, name: '학위요건' }, { id: 1, name: '교수배정' }, { id: 2, name: '주제선정' }, 
        { id: 3, name: '연구윤리' }, { id: 4, name: '계획서제출' }, { id: 5, name: '계획서심사' }, 
        { id: 6, name: '연구진행' }, { id: 7, name: '본심사신청' }, { id: 8, name: '본심사' }, 
        { id: 9, name: '최종수정' }, { id: 10, name: '최종제출' }, { id: 11, name: '졸업신청' }
    ],
    
    // 8. 공지사항 (from ver.1.995)
    announcements: [
        { id: 'an-003', title: '2025학년도 2학기 논문 본심사 일정 안내', author: '대학원 교학팀', date: '2025-08-12' }, 
        { id: 'an-002', title: 'KERIS 원문 제출 시스템 점검 안내 (8/15)', author: '중앙도서관', date: '2025-08-10' }, 
        { id: 'an-001', title: '논문 지도 시스템 오픈 안내', author: '대학원 교학팀', date: '2025-08-01' },
    ],
    
    // 9. 심사 (from ver.1.995)
    reviews: [
        { id: 'rev-001', studentName: '오심사', degree: '석사', type: '예비심사', title: '메타버스 기반 학습 환경의 효과성 연구', dueDate: '2025-08-30', status: 'pending', role: '심사위원장', metadata: { submissionDate: '2025-08-15', fileFormat: 'PDF', wordCount: '15,234', pageCount: '58' } }, 
        { id: 'rev-002', studentName: '강평가', degree: '박사', type: '본심사', title: 'AI 튜터링 시스템이 자기주도학습에 미치는 영향', dueDate: '2025-09-15', status: 'pending', role: '심사위원', metadata: { submissionDate: '2025-09-01', fileFormat: 'PDF', wordCount: '38,912', pageCount: '152' } },
    ],
    
    // 10. 심사 보고서 (from ver.1.995)
    evaluationReports: [
        { id: 'rep-001', studentName: '김한양', degree: '석사', title: '온라인 협업 도구가 팀 프로젝트 성과에 미치는 영향', reviewDate: '2025-07-10', submitted: true, role: '지도교수' }, 
        { id: 'rep-002', studentName: '이연구', degree: '석사', title: '청소년의 스마트폰 과의존과 학업 스트레스의 관계', reviewDate: '2025-07-11', submitted: true, role: '심사위원' }, 
        { id: 'rep-003', studentName: '최논문', degree: '석사', title: '플립러닝 기반 교수법이 학습 동기에 미치는 효과', reviewDate: '2025-07-12', submitted: false, role: '지도교수' }, 
        { id: 'rep-004', studentName: '박지성', degree: '박사', title: '교육용 AI 챗봇의 상호작용 유형 분석', reviewDate: '2025-07-13', submitted: true, role: '심사위원장' }, 
        { id: 'rep-005', studentName: '손흥민', degree: '석사', title: '게이미피케이션을 적용한 수학 교육 프로그램 개발', reviewDate: '2025-07-14', submitted: false, role: '심사위원' }, 
        { id: 'rep-006', studentName: '황희찬', degree: '석사', title: '유아 코딩 교육의 효과성에 대한 질적 연구', reviewDate: '2025-07-15', submitted: false, role: '지도교수' }, 
        { id: 'rep-007', studentName: '이강인', degree: '박사', title: '대학생의 학습전략과 학업성취도 간의 종단적 관계', reviewDate: '2025-07-16', submitted: true, role: '심사위원' }, 
        { id: 'rep-008', studentName: '조규성', degree: '석사', title: '디지털 리터러시 교육이 정보 판별 능력에 미치는 영향', reviewDate: '2025-07-17', submitted: false, role: '지도교수' }, 
        { id: 'rep-009', studentName: '김민재', degree: '석사', title: 'VR 기술을 활용한 역사 교육 콘텐츠 효과 분석', reviewDate: '2025-07-18', submitted: false, role: '심사위원장' }, 
        { id: 'rep-010', studentName: '황인범', degree: '박사', title: '학습자 데이터 분석을 통한 개인 맞춤형 학습 경로 추천 시스템 연구', reviewDate: '2025-07-19', submitted: true, role: '심사위원' },
    ],
    
    // 11. 상담 가능 시간 (from ver.1.995)
    availableTimeSlots: { 
        '2025-8-22': ['10:00', '11:00', '14:00'], 
        '2025-8-25': ['14:00', '15:00', '16:00'], 
        '2025-8-29': ['10:00', '11:00'] 
    }
};