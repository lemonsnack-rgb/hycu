// (주의) 이 파일은 UTF-8 형식으로 저장되어야 한글이 깨지지 않습니다.
// 메모장에서 저장 시 '인코딩'을 'UTF-8'로 설정하세요.

/**
 * ===================================================================
 * VI. 메인 스크립트 (진입점)
 * (뷰 렌더링, 이벤트 연결, 초기화)
 * ===================================================================
 */

// DOM이 로드된 후 모든 스크립트를 실행합니다.
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. 전역 DOM 요소 ---
    const contentArea = document.getElementById('content-area');
    const viewTitle = document.getElementById('view-title');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const langSwitcherBtn = document.getElementById('lang-switcher-btn');
    const langMenu = document.getElementById('lang-menu');
    const logoutBtn = document.getElementById('logout-btn');

    // (데이터는 data.js, 모달 함수는 common.js, 피드백 함수는 feedback.js에 있음)

    let currentDate = new Date(2025, 7, 13); // 랩미팅 캘린더용 (원래 8월 13일)
    let selectedDateForSchedule = null;

    // --- 2. 뷰(View)별 템플릿 정의 ---

    /**
     * [대시보드] 워크플로우 스텝 생성 (from ver.1.995)
     */
    function createWorkflowStepper(currentStage, size = 'normal') {
        const stepperClasses = size === 'small' ? 'stepper-sm' : '';
        let stepperHTML = `<div class="flex items-center ${stepperClasses}">`;
        professorData.workflow.forEach((step, index) => {
            let status = 'pending';
            if (step.id < currentStage) status = 'completed';
            if (step.id === currentStage) status = 'active';
            stepperHTML += `<div class="stepper-item ${status} flex items-center ${index === professorData.workflow.length - 1 ? '' : 'flex-1'}"><div class="stepper-circle w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs border-2 border-transparent transition-all duration-300">${step.id + 1}</div>${index < professorData.workflow.length - 1 ? '<div class="stepper-line h-0.5 flex-1 transition-all duration-300"></div>' : ''}</div>`;
        });
        stepperHTML += '</div>';
        if (size !== 'small') {
            stepperHTML += '<div class="flex mt-2">';
            professorData.workflow.forEach((step, index) => {
                let status = 'pending';
                if (step.id < currentStage) status = 'completed';
                if (step.id === currentStage) status = 'active';
                let textColor = 'text-gray-400';
                if (status === 'completed') textColor = 'text-[#6A0028]';
                if (status === 'active') textColor = 'text-[#C9BC9C] font-bold';
                stepperHTML += `<div class="text-center text-xs ${textColor} ${index === professorData.workflow.length - 1 ? '' : 'flex-1'}">${step.name}</div>`;
            });
            stepperHTML += '</div>';
        }
        return stepperHTML;
    }

    /**
     * 뷰(View) HTML 템플릿 객체
     */
    const views = {
        // [대시보드 뷰] (from ver.1.995)
        dashboard: () => `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div class="bg-white p-6 rounded-lg shadow-md">
                     <h3 class="font-bold text-lg text-gray-800 mb-2">교수 정보</h3>
                     <div class="space-y-2 text-sm"><p><strong class="w-20 inline-block">이름:</strong> ${professorData.profile.name}</p><p><strong class="w-20 inline-block">교번:</strong> ${professorData.profile.id}</p><p><strong class="w-20 inline-block">소속:</strong> ${professorData.profile.department}</p></div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="font-bold text-lg text-gray-800 mb-4">공지사항</h3>
                    <table class="w-full text-sm"><tbody>${professorData.announcements.slice(0, 3).map(an => `<tr class="border-b hover:bg-gray-50"><td class="py-2 pr-4 text-gray-800 truncate">${an.title}</td><td class="py-2 px-4 text-gray-500 w-28 text-right">${an.date}</td></tr>`).join('')}</tbody></table>
                </div>
            </div>
            <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h3 class="font-bold text-xl text-gray-800 mb-6">지도 학생 워크플로우 현황</h3>
                <div class="space-y-6">
                    <div class="grid grid-cols-6 gap-4 items-center"><div class="col-span-1"></div><div class="col-span-5"><div class="flex">${professorData.workflow.map((step, index) => `<div class="text-center text-xs text-gray-500 ${index === professorData.workflow.length - 1 ? '' : 'flex-1'}">${step.name}</div>`).join('')}</div></div></div>
                ${professorData.students.map(s => `<div class="grid grid-cols-6 gap-4 items-center"><div class="col-span-1 font-semibold text-gray-800">${s.name}</div><div class="col-span-5">${createWorkflowStepper(s.currentStage, 'small')}</div></div>`).join('')}
                </div>
            </div>
        `,
        
        // [지도 학생 관리 뷰] (from ver.1.996 - 업그레이드됨)
        studentManagement: () => `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-xl text-gray-800">지도 학생 목록</h3>
                    <button id="send-notification-btn" class="bg-[#6A0028] text-white px-4 py-2 rounded-md hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm" disabled>선택 학생 알림 발송</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="py-2 px-2 text-center w-12"><input type="checkbox" id="select-all-students" class="h-4 w-4 text-[#6A0028] focus:ring-[#6A0028] border-gray-300 rounded"></th>
                                <th class="py-2 px-4 text-left font-semibold text-gray-600">학번</th>
                                <th class="py-2 px-4 text-left font-semibold text-gray-600">학위과정</th>
                                <th class="py-2 px-4 text-left font-semibold text-gray-600">이름</th>
                                <th class="py-2 px-4 text-left font-semibold text-gray-600">전공</th>
                                <th class="py-2 px-4 text-left font-semibold text-gray-600">최근 활동</th>
                                <th class="py-2 px-4 text-center font-semibold text-gray-600">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${professorData.students.map(s => `
                                <tr class="border-b">
                                    <td class="py-3 px-2 text-center"><input type="checkbox" class="student-checkbox h-4 w-4 text-[#6A0028] focus:ring-[#6A0028] border-gray-300 rounded" data-student-id="${s.id}" data-student-name="${s.name}"></td>
                                    <td class="py-3 px-4 text-gray-600">${s.studentId}</td>
                                    <td class="py-3 px-4"><span class="degree-badge ${s.degree === '석사' ? 'master' : 'phd'}">${s.degree}</span></td>
                                    <td class="py-3 px-4 font-medium text-gray-800">
                                        <div class="flex items-center space-x-2">
                                            <span>${s.name}</span>
                                            <button class="student-info-btn text-gray-400 hover:text-[#6A0028]" title="학생 정보 보기" data-student-id="${s.id}">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                    <td class="py-3 px-4 text-gray-600">${s.major}</td>
                                    <td class="py-3 px-4 text-gray-600">${s.lastActivity}</td>
                                    <td class="py-3 px-4 text-center space-x-2">
                                        <button class="view-plan-btn text-xs text-white bg-gray-500 px-3 py-1 rounded-full hover:bg-gray-600" data-student-id="${s.id}">지도계획</button>
                                        <button class="view-record-btn text-xs text-white bg-gray-500 px-3 py-1 rounded-full hover:bg-gray-600" data-student-id="${s.id}">지도실적</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `,
        
        // [온라인 피드백 뷰] (from ver.1.25)
        onlineFeedback: () => `
             <div class="bg-white p-6 rounded-lg shadow-md">
                <div class="flex justify-between items-center mb-4"><h3 class="font-bold text-xl text-gray-800">온라인 피드백 요청 현황</h3></div>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="py-2 px-4 text-left font-semibold text-gray-600">학생명</th>
                                <th class="py-2 px-4 text-left font-semibold text-gray-600">문서명</th>
                                <th class="py-2 px-4 text-left font-semibold text-gray-600">단계</th>
                                <th class="py-2 px-4 text-left font-semibold text-gray-600">CopyKiller</th>
                                <th class="py-2 px-4 text-left font-semibold text-gray-600">GPT Killer</th>
                                <th class="py-2 px-4 text-left font-semibold text-gray-600">등록일</th>
                                <th class="py-2 px-4 text-left font-semibold text-gray-600">상태</th>
                            </tr>
                        </thead>
                        <tbody id="feedback-request-body">
                            </tbody>
                    </table>
                </div>
            </div>
        `,
        
        // [랩미팅 관리 뷰] (from ver.1.995)
        meetings: () => {
            const now = new Date('2025-08-20'); // 기준 시점
            const upcomingMeetings = professorData.meetings.filter(m => new Date(m.date) >= now && m.status === '예약');
            const pastMeetings = professorData.meetings.filter(m => new Date(m.date) < now);
            return `
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 class="font-bold text-xl text-gray-800 mb-4">다가오는 랩미팅</h3>
                ${upcomingMeetings.length > 0 ? `<div class="space-y-3">${upcomingMeetings.map(m => `<div class="bg-gray-50 p-3 rounded-md flex items-center justify-between"><div><span class="font-bold text-gray-800">${m.studentName}</span><span class="text-gray-600 text-sm ml-2">${m.date} ${m.time} (${m.type})</span></div><div class="flex items-center space-x-3">${m.type === '화상미팅' && m.zoomUrl ? `<a href="${m.zoomUrl}" target="_blank" class="text-sm bg-[#6A0028] text-white px-3 py-1 rounded-full hover:bg-opacity-90">Zoom 입장</a>` : ''}<button class="meeting-detail-btn text-sm text-gray-600 hover:underline" data-meeting-id="${m.id}">상세보기</button></div></div>`).join('')}</div>` : '<p class="text-center text-gray-500 py-4">예약된 랩미팅이 없습니다.</p>'}
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 class="font-bold text-xl text-gray-800 mb-4">지난 랩미팅 목록</h3>
                <div class="overflow-x-auto"><table class="min-w-full text-sm"><thead class="bg-gray-50"><tr><th class="py-2 px-4 text-left font-semibold text-gray-600">일시</th><th class="py-2 px-4 text-left font-semibold text-gray-600">학생명</th><th class="py-2 px-4 text-left font-semibold text-gray-600">유형</th></tr></thead><tbody>${pastMeetings.map(m => `<tr class="border-b hover:bg-gray-50 cursor-pointer meeting-detail-btn" data-meeting-id="${m.id}"><td class="py-3 px-4 text-gray-600">${m.date} ${m.time}</td><td class="py-3 px-4 font-medium text-gray-800">${m.studentName}</td><td class="py-3 px-4 text-gray-600">${m.type}</td></tr>`).join('')}</tbody></table></div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="font-bold text-xl text-gray-800 mb-4">랩미팅 가능 시간 설정</h3><p class="text-gray-600 mb-4 text-sm">캘린더에서 상담 가능한 날짜를 선택하고, 우측에서 가능한 시간대를 설정하여 학생들에게 노출합니다.</p>
                <div class="flex flex-col md:flex-row gap-6"><div id="schedule-calendar-container" class="flex-1"></div><div id="schedule-time-container" class="w-full md:w-1/3 border-l md:pl-6"><h4 id="selected-date-title" class="font-bold text-lg text-center mb-4 text-gray-500">날짜를 선택하세요</h4><div id="time-slots" class="space-y-2"></div><button id="save-schedule-btn" class="w-full mt-4 bg-[#6A0028] text-white px-4 py-2 rounded-md hover:bg-opacity-90">변경사항 저장</button></div></div>
            </div>
        `},
        
        // [심사 관리 뷰] (from ver.1.995)
        reviews: () => `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="font-bold text-xl text-gray-800 mb-4">심사 요청 목록</h3>
                <div class="overflow-x-auto"><table class="min-w-full text-sm"><thead class="bg-gray-50"><tr><th class="py-2 px-4 text-left font-semibold text-gray-600">심사 구분</th><th class="py-2 px-4 text-left font-semibold text-gray-600">학위</th><th class="py-2 px-4 text-left font-semibold text-gray-600">학생명</th><th class="py-2 px-4 text-left font-semibold text-gray-600">논문명</th><th class="py-2 px-4 text-left font-semibold text-gray-600">나의 역할</th><th class="py-2 px-4 text-left font-semibold text-gray-600">마감일</th><th class="py-2 px-4 text-left font-semibold text-gray-600">심사</th></tr></thead><tbody>${professorData.reviews.map(r => `<tr class="border-b"><td class="py-3 px-4"><span class="text-xs font-semibold px-2 py-1 rounded-full ${r.type === '본심사' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}">${r.type}</span></td><td class="py-3 px-4 text-gray-600">${r.degree}</td><td class="py-3 px-4 font-medium text-gray-800">${r.studentName}</td><td class="py-3 px-4 text-gray-800 truncate" style="max-width: 250px;">${r.title}</td><td class="py-3 px-4 font-semibold text-gray-700">${r.role}</td><td class="py-3 px-4 text-gray-600">${r.dueDate}</td><td class="py-3 px-4"><button class="review-btn text-sm bg-[#6A0028] text-white px-3 py-1 rounded-full hover:bg-opacity-90" data-review-id="${r.id}">심사하기</button></td></tr>`).join('')}</tbody></table></div>
            </div>
            <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h3 class="font-bold text-xl text-gray-800 mb-4">보고서 작성 및 생성</h3>
                <div class="overflow-x-auto"><table class="min-w-full text-sm"><thead class="bg-gray-50"><tr><th class="py-2 px-4 text-left font-semibold text-gray-600">학생명</th><th class="py-2 px-4 text-left font-semibold text-gray-600">학위</th><th class="py-2 px-4 text-left font-semibold text-gray-600">논문명</th><th class="py-2 px-4 text-left font-semibold text-gray-600">심사 완료일</th><th class="py-2 px-4 text-left font-semibold text-gray-600">상태</th><th class="py-2 px-4 text-left font-semibold text-gray-600">보고서</th></tr></thead><tbody>${professorData.evaluationReports.map(r => `<tr class="border-b"><td class="py-3 px-4 font-medium text-gray-800">${r.studentName}</td><td class="py-3 px-4 text-gray-600">${r.degree}</td><td class="py-3 px-4 text-gray-800 truncate" style="max-width: 250px;">${r.title}</td><td class="py-3 px-4 text-gray-600">${r.reviewDate}</td><td class="py-3 px-4"><span class="text-xs font-semibold px-2 py-1 rounded-full ${r.submitted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}">${r.submitted ? '제출 완료' : '작성 완료'}</span></td><td class="py-3 px-4"><button class="report-btn text-sm text-[#6A0028] hover:underline" data-report-id="${r.id}">상세보기</button></td></tr>`).join('')}</tbody></table></div>
            </div>
        `
    };

    // --- 3. 뷰(View) 렌더링 및 이벤트 연결 ---

    /**
     * 메인 뷰(View) 렌더링 함수
     * @param {string} view - 'dashboard', 'studentManagement' 등 views 객체의 키
     */
    function renderView(view) {
        // 1. 뷰 HTML 렌더링
        if (views[view]) {
            contentArea.innerHTML = views[view]();
        }
        
        // 2. 뷰 타이틀 변경
        viewTitle.textContent = document.querySelector(`.sidebar-link[data-view="${view}"]`).textContent.trim();
        
        // 3. 사이드바 활성 링크 변경
        sidebarLinks.forEach(link => link.classList.toggle('active', link.dataset.view === view));

        // 4. 뷰(View)별 특화 이벤트 리스너 할당
        // (common.js의 함수들을 호출)
        
        if (view === 'studentManagement') {
            const sendBtn = document.getElementById('send-notification-btn');
            const allCheckbox = document.getElementById('select-all-students');
            const studentCheckboxes = document.querySelectorAll('.student-checkbox');
            
            const updateSendButtonState = () => { 
                if(sendBtn) sendBtn.disabled = !Array.from(studentCheckboxes).some(cb => cb.checked); 
            };
            
            if(allCheckbox) allCheckbox.addEventListener('change', (e) => { 
                studentCheckboxes.forEach(cb => cb.checked = e.target.checked); 
                updateSendButtonState(); 
            });
            
            studentCheckboxes.forEach(cb => { 
                cb.addEventListener('change', () => { 
                    if(allCheckbox) allCheckbox.checked = Array.from(studentCheckboxes).every(cb => cb.checked); 
                    updateSendButtonState(); 
                }); 
            });
            
            if(sendBtn) sendBtn.addEventListener('click', showNotificationModal); // common.js
            document.querySelectorAll('.view-plan-btn').forEach(btn => btn.addEventListener('click', e => showPlanModal(e.target.dataset.studentId))); // common.js
            document.querySelectorAll('.view-record-btn').forEach(btn => btn.addEventListener('click', e => showRecordModal(e.target.dataset.studentId))); // common.js
            document.querySelectorAll('.student-info-btn').forEach(btn => btn.addEventListener('click', e => showStudentInfoModal(e.target.dataset.studentId))); // common.js
        } 
        else if (view === 'onlineFeedback') {
            // (ver.1.25) 데이터 구조에 맞게 목록 렌더링
            const tableBody = document.getElementById('feedback-request-body');
            // documentId 기준으로 그룹화하여 최신 버전만 필터링
            const latestVersions = Object.values(professorData.feedbackRequests.reduce((acc, curr) => {
                if (!acc[curr.documentId] || acc[curr.documentId].version < curr.version) {
                    acc[curr.documentId] = curr;
                }
                return acc;
            }, {}));

            tableBody.innerHTML = latestVersions
                .sort((a,b) => new Date(b.date) - new Date(a.date)) // 최신순 정렬
                .map(f => `
                <tr class="border-b hover:bg-gray-50 cursor-pointer" data-feedback-id="${f.id}" data-document-id="${f.documentId}">
                    <td class="py-3 px-4 font-medium text-gray-800">${f.studentName}</td>
                    <td class="py-3 px-4 text-gray-600">${f.file} (v${f.version})</td>
                    <td class="py-3 px-4 text-gray-600">${f.stage}</td>
                    <td class="py-3 px-4 font-semibold ${parseInt(f.copykillerScore) > 15 ? 'text-red-600' : 'text-green-600'}">${f.copykillerScore}</td>
                    <td class="py-3 px-4 font-semibold ${parseInt(f.gptkillerScore) > 10 ? 'text-red-600' : 'text-green-600'}">${f.gptkillerScore}</td>
                    <td class="py-3 px-4 text-gray-600">${f.date}</td>
                    <td class="py-3 px-4"><span class="text-xs font-semibold px-2 py-1 rounded-full ${f.status === '피드백 완료' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">${f.status}</span></td>
                </tr>
            `).join('');
            
            // (ver.1.25) 행 클릭 시, '답변 대기중'이면 edit, 아니면 readonly 모드로 피드백 상세 열기
            document.querySelectorAll('#feedback-request-body tr').forEach(row => {
                row.addEventListener('click', e => { 
                    if (e.target.tagName.toLowerCase() !== 'button') {
                        const feedbackId = e.currentTarget.dataset.feedbackId;
                        const feedback = professorData.feedbackRequests.find(f => f.id === feedbackId);
                        const mode = (feedback && feedback.status === '답변 대기중') ? 'edit' : 'readonly';
                        showFeedbackDetails(feedbackId, mode); // feedback.js
                    }
                });
            });
        }
        else if (view === 'meetings') {
            renderScheduleCalendar(); // 캘린더 렌더링
            renderTimeSlotsForDay(null); // 시간 슬롯 초기화
            document.querySelectorAll('.meeting-detail-btn').forEach(el => {
                el.addEventListener('click', e => showMeetingDetails(e.currentTarget.dataset.meetingId || e.target.closest('[data-meeting-id]').dataset.meetingId));
            });
            // '변경사항 저장' 버튼 이벤트 (알림 표시)
            const saveScheduleBtn = document.getElementById('save-schedule-btn');
            if(saveScheduleBtn) saveScheduleBtn.addEventListener('click', () => {
                alert('랩미팅 가능 시간이 저장되었습니다.');
                renderScheduleCalendar(); // 캘린더 갱신 (available 표시)
            });
        } 
        else if (view === 'reviews') {
            document.querySelectorAll('.review-btn').forEach(btn => btn.addEventListener('click', e => showReviewDetails(e.currentTarget.dataset.reviewId)));
            document.querySelectorAll('.report-btn').forEach(btn => btn.addEventListener('click', e => showReportDetails(e.currentTarget.dataset.reportId)));
        }
    }

    // --- 4. 뷰(View)별 특화 함수 (모달 내용 채우기 등) ---

    // [랩미팅 관리] 캘린더 렌더링 (from ver.1.995)
    function renderScheduleCalendar() {
        const container = document.getElementById('schedule-calendar-container');
        if (!container) return;
        const year = currentDate.getFullYear(), month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0);
        let calendarHtml = `<div class="flex items-center justify-between mb-4"><button id="prev-month" class="p-2 rounded-full hover:bg-gray-200">&lt;</button><h4 class="text-lg font-bold">${year}년 ${month + 1}월</h4><button id="next-month" class="p-2 rounded-full hover:bg-gray-200">&gt;</button></div><div class="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 mb-2"><div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div></div><div id="calendar-grid" class="grid grid-cols-7 gap-1">`;
        for (let i = 0; i < firstDay.getDay(); i++) calendarHtml += `<div></div>`;
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateStr = `${year}-${month + 1}-${day}`; // YYYY-M-D 형식
            let dayClasses = `calendar-day cursor-pointer p-2 rounded-full flex items-center justify-center aspect-square transition-colors`;
            if (new Date().toDateString() === new Date(year, month, day).toDateString()) dayClasses += ' today';
            if (Object.keys(professorData.availableTimeSlots).includes(dateStr)) dayClasses += ' available';
            if (dateStr === selectedDateForSchedule) dayClasses += ' selected';
            calendarHtml += `<div class="${dayClasses}" data-date="${dateStr}">${day}</div>`;
        }
        calendarHtml += `</div>`;
        container.innerHTML = calendarHtml;
        document.getElementById('prev-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderView('meetings'); });
        document.getElementById('next-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderView('meetings'); });
        document.querySelectorAll('.calendar-day').forEach(dayEl => { 
            dayEl.addEventListener('click', (e) => { 
                selectedDateForSchedule = e.target.dataset.date; 
                renderScheduleCalendar(); // 'selected' 클래스 적용
                renderTimeSlotsForDay(selectedDateForSchedule); // 시간 슬롯 렌더링
            }); 
        });
    }
    
    // [랩미팅 관리] 시간 슬롯 렌더링 (from ver.1.995)
    function renderTimeSlotsForDay(dateStr) {
        const container = document.getElementById('schedule-time-container');
        if (!container) return;
        const title = document.getElementById('selected-date-title'), slotsContainer = document.getElementById('time-slots');
        if (!dateStr) { 
            title.textContent = '날짜를 선택하세요'; 
            slotsContainer.innerHTML = '<p class="text-center text-gray-500 text-sm">캘린더에서 날짜를 선택해주세요.</p>'; 
            return; 
        }
        title.textContent = `${dateStr} 시간 설정`;
        const allTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
        const availableTimes = professorData.availableTimeSlots[dateStr] || [];
        slotsContainer.innerHTML = allTimes.map(time => `<label class="flex items-center p-2 rounded-md hover:bg-gray-100"><input type="checkbox" class="time-slot-checkbox h-4 w-4 text-[#6A0028] focus:ring-[#6A0028] border-gray-300 rounded" data-time="${time}" ${availableTimes.includes(time) ? 'checked' : ''}><span class="ml-3 text-gray-700">${time}</span></label>`).join('');
        
        // 체크박스 변경 시 data.js의 availableTimeSlots 실시간 업데이트
        slotsContainer.querySelectorAll('.time-slot-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', e => {
                const time = e.target.dataset.time;
                if (!professorData.availableTimeSlots[dateStr]) professorData.availableTimeSlots[dateStr] = [];
                const index = professorData.availableTimeSlots[dateStr].indexOf(time);
                if(e.target.checked) { 
                    if(index === -1) professorData.availableTimeSlots[dateStr].push(time); 
                } else { 
                    if(index > -1) professorData.availableTimeSlots[dateStr].splice(index, 1); 
                }
                // (캘린더의 'available' 점 표시 갱신)
                renderScheduleCalendar();
            });
        });
    }

    // [랩미팅 관리] 랩미팅 상세 모달 (from ver.1.995)
    function showMeetingDetails(meetingId) {
        const meeting = professorData.meetings.find(m => m.id === meetingId);
        if (!meeting) return;
        
        openModal('meeting-detail-modal', () => { // common.js
            const titleEl = document.getElementById('meeting-detail-title');
            const contentEl = document.getElementById('meeting-detail-content');
            titleEl.textContent = `${meeting.date} ${meeting.studentName} 학생 랩미팅`;
            let contentHTML = `<div class="border-b pb-2"><p><strong>일시:</strong> ${meeting.date} ${meeting.time}</p><p><strong>학생:</strong> ${meeting.studentName}</p><p><strong>유형:</strong> ${meeting.type}</p></div><div class="mt-4"><h4 class="font-bold text-gray-800 mb-2">주요 논의 내용</h4><p class="p-3 bg-gray-50 rounded-md text-sm">${meeting.summary || '논의 내용이 등록되지 않았습니다.'}</p></div>`;
            
            // 녹화 영상 버튼 (from ver.1.995)
            if (meeting.recordingUrl) {
                 contentHTML += `<div class="mt-4"><button data-meeting-id-for-video="${meeting.id}" class="watch-recording-btn w-full flex items-center justify-center bg-[#C9BC9C] text-[#6A0028] font-semibold py-2 rounded-md hover:bg-opacity-90 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg> 녹화 영상 다시보기</button></div>`;
            }
            
            if (meeting.zoomUrl && meeting.status === '예약') {
                contentHTML += `<div class="mt-4"><a href="${meeting.zoomUrl}" target="_blank" class="w-full flex items-center justify-center bg-[#6A0028] text-white font-semibold py-2 rounded-md hover:bg-opacity-90 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Zoom 미팅룸 입장</a></div>`;
            }
            
            contentEl.innerHTML = contentHTML;
            
            // 녹화 영상 버튼에 이벤트 리스너 추가
            const watchBtn = contentEl.querySelector('.watch-recording-btn');
            if (watchBtn) {
                watchBtn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.meetingIdForVideo;
                    closeModal('meeting-detail-modal'); // 현재 모달 닫기
                    showVideoPlayerModal(id); // 비디오 플레이어 모달 열기
                });
            }
        });
    }

    // [랩미팅 관리] 비디오 플레이어 모달 (from ver.1.995)
    function showVideoPlayerModal(meetingId) {
        const meeting = professorData.meetings.find(m => m.id === meetingId);
        if (!meeting || !meeting.recordingUrl) return;

        openModal('video-player-modal', () => { // common.js
            document.getElementById('video-player-modal-title').textContent = `[${meeting.studentName}] 랩미팅 다시보기`;
            document.getElementById('video-info-text').innerHTML = `<p><strong>- 학생:</strong> ${meeting.studentName}</p><p><strong>- 일시:</strong> ${meeting.date} ${meeting.time}</p><p><strong>- 주요 논의 내용:</strong> ${meeting.summary}</p>`;
            
            // 기존 플레이어 인스턴스가 있으면 제거
            if (modals['video-player-modal'].player) {
                modals['video-player-modal'].player.dispose();
            }
            
            const player = videojs('my-video-player');
            modals['video-player-modal'].player = player; // 모달 객체에 인스턴스 저장

            player.src({
                type: 'video/mp4',
                src: meeting.recordingUrl // data.js에서 설정된 URL
            });

            player.ready(function() {
                console.log('랩미팅 영상 플레이어가 준비되었습니다.');
                this.play(); // 자동 재생
            });
        });
    }

    // [심사 관리] 심사 평가표 모달 (from ver.1.995)
    function showReviewDetails(reviewId) {
        const review = professorData.reviews.find(r => r.id === reviewId);
        if (!review) return;
        
        openModal('review-modal', () => { // common.js
            const contentEl = document.getElementById('review-modal-content');
            document.getElementById('review-modal-title').textContent = `[${review.type}] ${review.studentName} 학생 논문 심사`;
            const evaluationItems = [ { category: '연구 주제', criteria: '주제의 창의성 및 학문적 기여도' }, { category: '내용 구성', criteria: '서론, 본론, 결론의 논리적 연계성' }, { category: '연구 방법', criteria: '연구 방법의 타당성 및 신뢰성' }, { category: '결과 분석', criteria: '결과 분석 및 해석의 적절성' }, { category: '논문 형식', criteria: '참고문헌 및 각주 형식의 정확성' }];
            contentEl.innerHTML = `<div class="space-y-6"><div class="mb-6"><h4 class="text-lg font-bold text-gray-800 mb-2">논문 정보</h4><div class="rounded-lg border p-4 bg-gray-50 text-sm space-y-2"><p><strong>논문 제목:</strong> ${review.title}</p><div class="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t mt-2"><p><strong>학위 과정:</strong> ${review.degree}</p><p><strong>나의 역할:</strong> <span class="font-bold text-[#6A0028]">${review.role}</span></p><p><strong>제출일:</strong> ${review.metadata.submissionDate}</p><p><strong>파일 형식:</strong> ${review.metadata.fileFormat}</p><p><strong>단어 수:</strong> ${review.metadata.wordCount}자</p><p><strong>페이지 수:</strong> ${review.metadata.pageCount}p</p></div></div><div class="mt-4"><a href="#" class="w-full text-sm text-white bg-[#6A0028] hover:bg-opacity-90 font-semibold py-2 rounded-md flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg> 논문 파일 다운로드</a></div></div><hr><div><h4 class="text-lg font-bold text-gray-800 mb-2">정량 평가</h4><div class="space-y-4 rounded-lg border p-4">${evaluationItems.map((item, index) => `<div class="grid grid-cols-3 items-center"><div class="col-span-1"><p class="font-semibold text-gray-700">${item.category}</p><p class="text-xs text-gray-500">${item.criteria}</p></div><div class="col-span-2 flex justify-end items-center space-x-4"><span class="text-sm">매우 미흡</span>${[1,2,3,4,5].map(score => `<label class="flex flex-col items-center"><input type="radio" name="score-${index}" value="${score}" class="h-4 w-4 text-[#6A0028] focus:ring-[#6A0028]"><span class="text-xs mt-1">${score}</span></label>`).join('')}<span class="text-sm">매우 우수</span></div></div>`).join('<hr class="my-2">')}</div></div><div><h4 class="text-lg font-bold text-gray-800 mb-2">정성 평가</h4><div class="space-y-4 rounded-lg border p-4"><div><label class="block text-sm font-semibold text-gray-700 mb-1">총평</label><textarea class="w-full p-2 border rounded-md text-sm" rows="5" placeholder="심사 총평을 입력하세요..."></textarea></div><div><label class="block text-sm font-semibold text-gray-700 mb-1">수정 및 보완 사항</label><textarea class="w-full p-2 border rounded-md text-sm" rows="5" placeholder="구체적인 수정 및 보완 사항을 입력하세요..."></textarea></div></div></div><div><h4 class="text-lg font-bold text-gray-800 mb-2">심사 결과</h4><div class="rounded-lg border p-4"><div class="flex items-center space-x-6"><label class="flex items-center"><input type="radio" name="review-result" value="pass" class="h-4 w-4 text-green-600 focus:ring-green-500"><span class="ml-2 text-green-700 font-semibold">통과</span></label><label class="flex items-center"><input type="radio" name="review-result" value="conditional" class="h-4 w-4 text-yellow-600 focus:ring-yellow-500"><span class="ml-2 text-yellow-700 font-semibold">수정 후 통과</span></label><label class="flex items-center"><input type="radio" name="review-result" value="fail" class="h-4 w-4 text-red-600 focus:ring-red-500"><span class="ml-2 text-red-700 font-semibold">탈락</span></label></div></div></div></div>`;
        });
    }

    // [심사 관리] 심사 보고서 모달 (from ver.1.995)
    function showReportDetails(reportId) {
         const report = professorData.evaluationReports.find(r => r.id === reportId);
        if (!report) return;
        
        openModal('report-modal', () => { // common.js
            const contentEl = document.getElementById('report-modal-content');
            const footerEl = document.getElementById('report-modal-footer');
            document.getElementById('report-modal-title').textContent = `[${report.studentName}] 심사 보고서`;
            
            // 학생의 피드백 기록 필터링
            const feedbackHistory = professorData.feedbackRequests
                .filter(f => f.studentName === report.studentName && f.status === '피드백 완료')
                .sort((a,b) => new Date(a.date) - new Date(b.date)); // 오래된 순
                
            contentEl.innerHTML = `<div class="space-y-6"><div><h4 class="text-lg font-bold text-gray-800 mb-2">최종 심사 내용 (${report.reviewDate})</h4><div class="space-y-4 rounded-lg border p-4 bg-gray-50"><div class="border-b pb-2"><p class="font-semibold">나의 역할: <span class="font-normal">${report.role}</span></p><p class="font-semibold">종합 점수: <span class="text-[#6A0028] text-xl">88</span> / 100점</p><p class="font-semibold">심사 결과: <span class="text-green-600">가결</span></p></div><div><p class="font-semibold text-gray-700">총평</p><p class="text-sm text-gray-600 mt-1 pl-2 border-l-2">연구 주제의 독창성과 시의성이 매우 뛰어나며, 논리 전개 과정이 명확함. 일부 통계 분석에서 발생한 사소한 오류를 수정한다면 더욱 완성도 높은 논문이 될 것으로 기대됨.</p></div></div></div><div><h4 class="text-lg font-bold text-gray-800 mb-2">지도 피드백 기록</h4><div class="space-y-3">${feedbackHistory.length > 0 ? feedbackHistory.map(f => `<div class="p-3 border rounded-md"><div class="flex justify-between items-center"><p class="font-semibold text-gray-700">${f.stage} - ${f.file} (v${f.version})</p><p class="text-xs text-gray-500">${f.date}</p></div><p class="text-xs mt-1 text-gray-500">CopyKiller: ${f.copykillerScore} / GPT Killer: ${f.gptkillerScore}</p></div>`).join('') : '<p class="text-sm text-gray-500">피드백 기록이 없습니다.</p>'}</div></div></div>`;
            
            if (report.submitted) {
                footerEl.innerHTML = `<span class="text-sm font-semibold text-green-600">이 보고서는 제출 완료되었습니다.</span>`;
            } else {
                footerEl.innerHTML = `<button class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md mr-2 hover:bg-gray-300 text-sm">저장</button><button class="bg-[#C9BC9C] text-[#6A0028] px-4 py-2 rounded-md mr-2 hover:bg-opacity-90 text-sm">보고서 다운로드</button><button class="bg-[#6A0028] text-white px-4 py-2 rounded-md hover:bg-opacity-90 text-sm">보고서 제출</button>`;
            }
        });
    }


    // --- 5. 전역 이벤트 리스너 (최초 1회만 할당) ---

    // 사이드바 메뉴 링크 클릭
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.currentTarget.dataset.view;
            renderView(view);
            // 모바일 뷰에서 메뉴 클릭 시 사이드바 닫기
            if (window.innerWidth < 640) {
                sidebar.classList.add('-translate-x-full');
                sidebarBackdrop.classList.add('hidden');
            }
        });
    });

    // 모바일 햄버거 메뉴 토글
    menuToggle.addEventListener('click', () => { 
        sidebar.classList.toggle('-translate-x-full'); 
        sidebarBackdrop.classList.toggle('hidden'); 
    });
    sidebarBackdrop.addEventListener('click', () => { 
        sidebar.classList.add('-translate-x-full'); 
        sidebarBackdrop.classList.add('hidden'); 
    });

    // 언어 변경 토글
    langSwitcherBtn.addEventListener('click', () => { 
        langMenu.classList.toggle('hidden'); 
    });
    // 언어 변경 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
        if (!langSwitcherBtn.contains(e.target) && !langMenu.contains(e.target)) {
            langMenu.classList.add('hidden');
        }
    });

    // 로그아웃 버튼
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('로그아웃 하시겠습니까?')) {
                document.body.innerHTML = `
                    <div class="h-screen w-screen flex items-center justify-center bg-gray-100">
                        <div class="text-center">
                            <h1 class="text-3xl font-bold text-gray-800 mb-4">로그아웃되었습니다.</h1>
                            <p class="text-gray-600">이용해주셔서 감사합니다.</p>
                        </div>
                    </div>
                `;
            }
        });
    }
    
    // [학생 관리] 지도 계획 등록 폼 (모달 내부에 있으므로 이벤트 위임 대신 document에 연결)
    const planModal = document.getElementById('plan-modal');
    if (planModal) {
        planModal.querySelector('#add-plan-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const studentId = e.target.dataset.studentId;
            const student = professorData.students.find(s => s.id === studentId);
            if (!student) return;
            
            const formData = new FormData(e.target);
            student.plans.push({ 
                session: formData.get('session') || student.plans.length + 1, 
                topic: formData.get('topic'), 
                content: formData.get('content'), 
                method: formData.get('method'), 
                date: formData.get('date') 
            });
            
            renderPlanList(studentId); // common.js
            e.target.reset();
        });
    }

    // --- 6. 애플리케이션 초기화 ---
    
    // 퀵마크 팝오버 초기 렌더링 (common.js)
    renderQuickMarkPopover();
    
    // 첫 화면으로 '대시보드' 렌더링
    renderView('dashboard');
    
    // (피드백 모듈의 전역 변수를 window 객체에 연결 - 모듈 간 참조용)
    // (feedback.js의 함수들을 main.js의 renderView에서 호출할 수 있도록 함)
    window.showFeedbackDetails = showFeedbackDetails; 

});