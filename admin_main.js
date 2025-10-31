// ========== 뷰 전환 함수 ==========

function switchView(viewName) {
    // 사이드바 active 상태 변경
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-view="${viewName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // 제목 변경
    const viewTitles = {
        dashboard: '대시보드',
        researchProposal: '연구계획서 제출 현황',
        thesisPlan: '논문작성계획서 제출 현황',
        midThesis: '중간논문 제출 현황',
        finalThesis: '최종논문 제출 현황',
        journalSubmission: '학술지 심사 신청 현황',
        guidanceProgress: '논문지도 진행 현황',
        scheduleManagement: '논문지도 일정 관리',
        requirementManagement: '논문 제출 요건 관리',
        stageManagement: '논문지도 단계 관리',
        typeManagement: '지도 단계 유형 관리',
        evaluationCriteria: '평가 기준 관리'
    };
    
    document.getElementById('view-title').textContent = viewTitles[viewName] || '대시보드';
    
    // 컨텐츠 렌더링
    document.getElementById('content-area').innerHTML = views[viewName]();
}

// ========== 이벤트 리스너 초기화 ==========

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ 논문 지도 관리 시스템 초기화 완료');
    
    // 사이드바 링크 클릭 이벤트
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.dataset.view;
            switchView(view);
        });
    });

    // 모달 닫기 버튼들
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('confirm-cancel').addEventListener('click', closeConfirm);
    document.getElementById('alert-ok').addEventListener('click', closeAlert);

    // 모달 백드롭 클릭
    document.getElementById('modal-backdrop').addEventListener('click', () => {
        closeModal();
        closeConfirm();
        closeAlert();
    });

    // 모바일 메뉴 토글 (있는 경우)
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('-translate-x-full');
        });
    }

    // 초기 화면 렌더링
    switchView('dashboard');
    
    console.log('📊 샘플 데이터 로드 완료:', {
        연구계획서: appData.submissions.researchProposal.length,
        중간논문: appData.submissions.midThesis.length,
        최종논문: appData.submissions.finalThesis.length,
        학술지: appData.submissions.journalSubmission.length,
        진행현황: appData.guidanceProgress.length
    });
});

// ========== 전역 함수 (디버깅용) ==========

window.debugInfo = () => {
    console.log('=== 시스템 상태 ===');
    console.log('현재 화면:', document.getElementById('view-title').textContent);
    console.log('전체 데이터:', appData);
    console.log('사용 가능한 화면:', Object.keys(views));
};

// ========== API 연결 가이드 (주석) ==========

/*
API 연결 시 수정 방법:

1. admin_data.js 파일 수정
   - appData 객체를 API 호출로 대체
   
   예시:
   async function loadData() {
       const response = await fetch('/api/admin/data');
       const data = await response.json();
       Object.assign(appData, data);
   }

2. admin_modals.js 파일 수정
   - CRUD 함수에서 API 호출 추가
   
   예시 (일정 추가):
   openModal(isEdit ? '일정 수정' : '일정 추가', content, '저장', async () => {
       const newItem = { ... };
       
       // API 호출
       const response = await fetch('/api/schedules', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(newItem)
       });
       
       if (response.ok) {
           const savedItem = await response.json();
           appData.schedules.push(savedItem);
           closeModal();
           showAlert('일정이 저장되었습니다.');
           switchView('scheduleManagement');
       }
   });

3. admin_views.js 파일
   - 화면 렌더링 로직은 그대로 유지
   - 필요시 실시간 업데이트 추가

4. admin_main.js 파일
   - DOMContentLoaded에서 초기 데이터 로드
   
   예시:
   document.addEventListener('DOMContentLoaded', async () => {
       await loadData();  // 데이터 로드
       switchView('dashboard');  // 초기 화면
   });
*/

// ========== 검색 기능 ==========

// 검색 실행
function searchSubmissions(type) {
    const filters = {
        year: document.getElementById('search-year')?.value || '',
        semester: document.getElementById('search-semester')?.value || '',
        advisor: document.getElementById('search-advisor')?.value || '',
        semesterCount: document.getElementById('search-semester-count')?.value || '',
        status: document.getElementById('search-status')?.value || '',
        major: document.getElementById('search-major')?.value || '',
        degree: document.getElementById('search-degree')?.value || '',
        result: document.getElementById('search-result')?.value || '',
        approval: document.getElementById('search-approval')?.value || '',
        journalType: document.getElementById('search-journal-type')?.value || '',
        authorType: document.getElementById('search-author-type')?.value || '',
        keyword: document.getElementById('search-keyword')?.value || ''
    };
    
    // 원본 데이터 백업 (첫 검색 시)
    if (!appData.originalSubmissions) {
        appData.originalSubmissions = {};
    }
    if (!appData.originalSubmissions[type]) {
        appData.originalSubmissions[type] = [...appData.submissions[type]];
    }
    
    // 필터링
    let filtered = [...appData.originalSubmissions[type]];
    
    // 학년도
    if (filters.year) {
        filtered = filtered.filter(item => {
            const submitYear = item.submitDate?.substring(0, 4);
            return submitYear === filters.year;
        });
    }
    
    // 학기
    if (filters.semester) {
        filtered = filtered.filter(item => {
            const submitMonth = parseInt(item.submitDate?.substring(5, 7));
            if (filters.semester === '1') {
                return submitMonth >= 3 && submitMonth <= 8; // 1학기: 3-8월
            } else {
                return submitMonth >= 9 || submitMonth <= 2; // 2학기: 9-2월
            }
        });
    }
    
    // 논문지도교수
    if (filters.advisor) {
        filtered = filtered.filter(item => item.advisor === filters.advisor);
    }
    
    // 학과/전공
    if (filters.major) {
        filtered = filtered.filter(item => item.major === filters.major);
    }
    
    // 학위과정
    if (filters.degree) {
        filtered = filtered.filter(item => item.degree === filters.degree);
    }
    
    // 상태/합격여부
    if (filters.status) {
        filtered = filtered.filter(item => item.status === filters.status);
    }
    if (filters.result) {
        filtered = filtered.filter(item => item.result === filters.result);
    }
    if (filters.approval) {
        filtered = filtered.filter(item => item.status === filters.approval);
    }
    
    // 학술지 유형
    if (filters.journalType) {
        filtered = filtered.filter(item => {
            if (filters.journalType === 'KCI') return item.kci;
            if (filters.journalType === 'SCOPUS') return item.scopus;
            if (filters.journalType === 'SCI') return item.sci;
            return true;
        });
    }
    
    // 저자 구분
    if (filters.authorType) {
        filtered = filtered.filter(item => {
            if (filters.authorType === '제1저자') return item.isFirstAuthor;
            if (filters.authorType === '공동저자') return !item.isFirstAuthor;
            return true;
        });
    }
    
    // 학번/성명 키워드
    if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filtered = filtered.filter(item => {
            return item.studentName?.toLowerCase().includes(keyword) ||
                   item.studentId?.toLowerCase().includes(keyword);
        });
    }
    
    // 필터링된 데이터로 교체
    appData.submissions[type] = filtered;
    
    // 현재 뷰 새로고침 (화면 전환 없이 테이블만 업데이트)
    const contentDiv = document.getElementById('content');
    if (contentDiv && adminViews[type]) {
        contentDiv.innerHTML = adminViews[type]();
    }
    
    // 결과 알림
    showAlert(`검색 결과: ${filtered.length}건`);
}

// 검색 초기화
function resetSearch(type) {
    // 원본 데이터 복원
    if (appData.originalSubmissions && appData.originalSubmissions[type]) {
        appData.submissions[type] = [...appData.originalSubmissions[type]];
    }
    
    // 검색 필드 초기화
    const searchFields = [
        'search-year', 'search-semester', 'search-advisor', 
        'search-semester-count', 'search-status', 'search-major',
        'search-degree', 'search-result', 'search-approval',
        'search-journal-type', 'search-author-type', 'search-keyword'
    ];
    
    searchFields.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.value = '';
        }
    });
    
    // 현재 뷰 새로고침 (화면 전환 없이 테이블만 업데이트)
    const contentDiv = document.getElementById('content');
    if (contentDiv && adminViews[type]) {
        contentDiv.innerHTML = adminViews[type]();
    }
    
    showAlert('검색 조건이 초기화되었습니다.');
}

// ========== 연구계획서 승인 기능 ==========

function approveResearchProposal(id) {
    // 해당 연구계획서 찾기
    const item = appData.submissions.researchProposal.find(r => r.id === id);
    if (!item) {
        showAlert('연구계획서를 찾을 수 없습니다.');
        return;
    }
    
    // 상태 변경
    item.status = '승인완료';
    
    // 승인 정보 추가
    const today = new Date();
    item.approvalDate = today.toISOString().split('T')[0];
    item.reviewComment = '연구계획서 검토 완료. 승인합니다.';
    
    // 원본 데이터도 업데이트
    if (appData.originalSubmissions && appData.originalSubmissions.researchProposal) {
        const originalItem = appData.originalSubmissions.researchProposal.find(r => r.id === id);
        if (originalItem) {
            originalItem.status = '승인완료';
            originalItem.approvalDate = item.approvalDate;
            originalItem.reviewComment = item.reviewComment;
        }
    }
    
    // 모달 닫기
    closeModal();
    
    // 성공 메시지
    showAlert('연구계획서가 승인되었습니다.');
    
    // 화면 새로고침
    switchView('researchProposal');
}

// 연구계획서 반려
function rejectResearchProposal(id, reason) {
    const item = appData.submissions.researchProposal.find(r => r.id === id);
    if (!item) {
        showAlert('연구계획서를 찾을 수 없습니다.');
        return;
    }
    
    // 상태 변경
    item.status = '반려';
    
    // 반려 정보 추가
    const today = new Date();
    item.rejectDate = today.toISOString().split('T')[0];
    item.rejectReason = reason;
    
    // 원본 데이터도 업데이트
    if (appData.originalSubmissions && appData.originalSubmissions.researchProposal) {
        const originalItem = appData.originalSubmissions.researchProposal.find(r => r.id === id);
        if (originalItem) {
            originalItem.status = '반려';
            originalItem.rejectDate = item.rejectDate;
            originalItem.rejectReason = item.rejectReason;
        }
    }
    
    // 모달 닫기
    closeModal();
    
    // 성공 메시지
    showAlert('연구계획서가 반려되었습니다.');
    
    // 화면 새로고침
    switchView('researchProposal');
}

// 승인 취소
function cancelApprovalResearchProposal(id) {
    const item = appData.submissions.researchProposal.find(r => r.id === id);
    if (!item) {
        showAlert('연구계획서를 찾을 수 없습니다.');
        return;
    }
    
    // 상태 변경
    item.status = '승인대기';
    
    // 승인 정보 삭제
    delete item.approvalDate;
    delete item.reviewComment;
    
    // 원본 데이터도 업데이트
    if (appData.originalSubmissions && appData.originalSubmissions.researchProposal) {
        const originalItem = appData.originalSubmissions.researchProposal.find(r => r.id === id);
        if (originalItem) {
            originalItem.status = '승인대기';
            delete originalItem.approvalDate;
            delete originalItem.reviewComment;
        }
    }
    
    // 모달 닫기
    closeModal();
    
    // 성공 메시지
    showAlert('승인이 취소되었습니다.');
    
    // 화면 새로고침
    switchView('researchProposal');
}

// ========== 주차별 논문지도 검색 ==========

function searchWeeklyGuidance() {
    const filters = {
        year: document.getElementById('weekly-search-year')?.value || '',
        semester: document.getElementById('weekly-search-semester')?.value || '',
        major: document.getElementById('weekly-search-major')?.value || '',
        degree: document.getElementById('weekly-search-degree')?.value || '',
        advisor: document.getElementById('weekly-search-advisor')?.value || '',
        count: document.getElementById('weekly-search-count')?.value || '',
        keyword: document.getElementById('weekly-search-keyword')?.value.toLowerCase().trim() || ''
    };
    
    // 원본 데이터 백업
    if (!appData.originalWeeklyGuidanceStudents) {
        appData.originalWeeklyGuidanceStudents = [...appData.weeklyGuidanceStudents];
    }
    
    // 필터링
    let filtered = [...appData.originalWeeklyGuidanceStudents];
    
    // 학과
    if (filters.major) {
        filtered = filtered.filter(item => item.major === filters.major);
    }
    
    // 학위과정
    if (filters.degree) {
        filtered = filtered.filter(item => item.degree === filters.degree);
    }
    
    // 지도교수 (복수 지도교수 고려)
    if (filters.advisor) {
        filtered = filtered.filter(item => item.advisors.includes(filters.advisor));
    }
    
    // 지도횟수
    if (filters.count) {
        const count = parseInt(filters.count);
        if (count === 0) {
            // 지도계획 없음
            filtered = filtered.filter(item => item.guidanceCount === 0);
        } else {
            // N회 이상
            filtered = filtered.filter(item => item.guidanceCount >= count);
        }
    }
    
    // 학번/성명 키워드
    if (filters.keyword) {
        filtered = filtered.filter(item => {
            return item.studentName.toLowerCase().includes(filters.keyword) ||
                   item.studentId.toLowerCase().includes(filters.keyword);
        });
    }
    
    appData.weeklyGuidanceStudents = filtered;
    
    // 화면 새로고침
    switchView('weeklyGuidance');
    
    showAlert(`검색 결과: ${filtered.length}건`);
}

function resetWeeklyGuidanceSearch() {
    // 원본 데이터 복원
    if (appData.originalWeeklyGuidanceStudents) {
        appData.weeklyGuidanceStudents = [...appData.originalWeeklyGuidanceStudents];
    }
    
    // 검색 필드 초기화
    const searchFields = [
        'weekly-search-year',
        'weekly-search-semester',
        'weekly-search-major',
        'weekly-search-degree',
        'weekly-search-advisor',
        'weekly-search-count',
        'weekly-search-keyword'
    ];
    
    searchFields.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.value = '';
        }
    });
    
    // 화면 새로고침
    switchView('weeklyGuidance');
    
    showAlert('검색 조건이 초기화되었습니다.');
}

// 이전 함수들 (하위 호환성)
function searchGuidanceStudents() {
    searchWeeklyGuidance();
}

function resetGuidanceSearch() {
    resetWeeklyGuidanceSearch();
}

// ========== 논문지도 진행 현황 검색 ==========

function searchGuidanceProgress() {
    const filters = {
        year: document.getElementById('progress-search-year')?.value || '',
        semester: document.getElementById('progress-search-semester')?.value || '',
        major: document.getElementById('progress-search-major')?.value || '',
        degree: document.getElementById('progress-search-degree')?.value || '',
        stage: document.getElementById('progress-search-stage')?.value || '',
        status: document.getElementById('progress-search-status')?.value || '',
        keyword: document.getElementById('progress-search-keyword')?.value.toLowerCase().trim() || ''
    };
    
    // 원본 데이터 백업
    if (!appData.originalGuidanceProgress) {
        appData.originalGuidanceProgress = [...appData.guidanceProgress];
    }
    
    // 필터링
    let filtered = [...appData.originalGuidanceProgress];
    
    // 학과
    if (filters.major) {
        filtered = filtered.filter(item => item.major === filters.major);
    }
    
    // 학위과정
    if (filters.degree) {
        filtered = filtered.filter(item => item.degree === filters.degree);
    }
    
    // 단계
    if (filters.stage) {
        filtered = filtered.filter(item => item.stage === filters.stage);
    }
    
    // 피드백 상태
    if (filters.status) {
        filtered = filtered.filter(item => item.feedbackStatus === filters.status);
    }
    
    // 학번/성명 키워드
    if (filters.keyword) {
        filtered = filtered.filter(item => {
            return item.studentName.toLowerCase().includes(filters.keyword) ||
                   item.studentId.toLowerCase().includes(filters.keyword);
        });
    }
    
    appData.guidanceProgress = filtered;
    
    // 화면 새로고침
    switchView('guidanceProgress');
    
    showAlert(`검색 결과: ${filtered.length}건`);
}

function resetGuidanceProgressSearch() {
    // 원본 데이터 복원
    if (appData.originalGuidanceProgress) {
        appData.guidanceProgress = [...appData.originalGuidanceProgress];
    }
    
    // 검색 필드 초기화
    const searchFields = [
        'progress-search-year',
        'progress-search-semester',
        'progress-search-major',
        'progress-search-degree',
        'progress-search-stage',
        'progress-search-status',
        'progress-search-keyword'
    ];
    
    searchFields.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.value = '';
        }
    });
    
    // 화면 새로고침
    switchView('guidanceProgress');
    
    showAlert('검색 조건이 초기화되었습니다.');
}

console.log('🚀 모든 JavaScript 모듈 로드 완료!');
console.log('💡 window.debugInfo()를 실행하여 시스템 상태를 확인하세요.');
