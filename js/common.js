// (주의) 이 파일은 UTF-8 형식으로 저장되어야 한글이 깨지지 않습니다.
// 메모장에서 저장 시 '인코딩'을 'UTF-8'로 설정하세요.

/**
 * ===================================================================
 * II. 공통 모달 관리 로직
 * (모든 모달의 열기/닫기 및 백드롭 처리)
 * ===================================================================
 */

// 전역에서 모달 DOM 요소를 관리
const modals = {
    'student-info-modal': { element: document.getElementById('student-info-modal') },
    'notification-modal': { element: document.getElementById('notification-modal') },
    'plan-modal': { element: document.getElementById('plan-modal') },
    'record-modal': { element: document.getElementById('record-modal') },
    'feedback-modal': { element: document.getElementById('feedback-modal') },
    'version-select-modal': { element: document.getElementById('version-select-modal') },
    'meeting-detail-modal': { element: document.getElementById('meeting-detail-modal') },
    'review-modal': { element: document.getElementById('review-modal') },
    'report-modal': { element: document.getElementById('report-modal') },
    'video-player-modal': { element: document.getElementById('video-player-modal'), player: null }
};

const modalBackdrop = document.getElementById('modal-backdrop');

/**
 * 모달을 여는 공통 함수
 * @param {string} modalId - 열고자 하는 모달의 ID (modals 객체의 키)
 * @param {function} [onOpenCallback] - 모달이 열린 직후 실행할 콜백 함수
 */
function openModal(modalId, onOpenCallback) {
    const modalInfo = modals[modalId];
    if (!modalInfo) return;

    // z-index 관리 (피드백 모달 위에 버전 모달이 열릴 수 있도록)
    const zIndexBase = (modalId === 'feedback-modal' || modalId === 'student-info-modal') ? 50 : 60;
    modalInfo.element.style.zIndex = zIndexBase;
    modalBackdrop.style.zIndex = zIndexBase - 1;

    modalBackdrop.classList.remove('hidden');
    modalInfo.element.classList.remove('hidden');
    
    // 열기 애니메이션
    setTimeout(() => {
        const modalContent = modalInfo.element.querySelector('div'); 
        if(modalContent) modalContent.classList.remove('scale-95');
    }, 10);

    if (onOpenCallback) onOpenCallback();
}

/**
 * 모달을 닫는 공통 함수
 * @param {string} modalId - 닫고자 하는 모달의 ID
 */
function closeModal(modalId) {
    const modalInfo = modals[modalId];
    if (!modalInfo || modalInfo.element.classList.contains('hidden')) return;

    // 피드백 모달의 키다운 핸들러 제거 (feedback.js에서 할당)
    if (modalId === 'feedback-modal' && window.activeKeyDownHandler) {
        window.removeEventListener('keydown', window.activeKeyDownHandler);
        window.activeKeyDownHandler = null;
    }

    // 비디오 플레이어 모달  Fd을 때 영상 정지
    if (modalId === 'video-player-modal' && modals['video-player-modal'].player) {
        const player = modals['video-player-modal'].player;
        if (player && !player.isDisposed()) {
            player.pause();
        }
    }

    const modalContent = modalInfo.element.querySelector('div');
    if (modalContent) modalContent.classList.add('scale-95');
    
    // 닫기 애니메이션 후 숨김 처리
    setTimeout(() => {
        modalInfo.element.classList.add('hidden');
        
        // 다른 모달이 열려있는지 확인
        const anyModalOpen = Object.values(modals).some(m => !m.element.classList.contains('hidden'));
        
        if (!anyModalOpen) {
            modalBackdrop.classList.add('hidden');
        } else if (!modals['feedback-modal'].element.classList.contains('hidden')) {
           // 피드백 모달이 여전히 열려있다면, 백드롭 z-index를 피드백 모달 기준으로 복원
           modalBackdrop.style.zIndex = 49; // feedback-modal의 z-index(50) - 1
        }
    }, 300);
}

// 모든 모달 닫기 버튼(X)과 백드롭에 이벤트 리스너 할당
document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', e => closeModal(e.target.closest('.fixed').id));
});
modalBackdrop.addEventListener('click', () => {
    // 가장 위에 열린 모달을 닫습니다.
    let topModalId = null;
    let maxZ = -1;
    Object.entries(modals).forEach(([id, info]) => {
        if (!info.element.classList.contains('hidden')) {
            const z = parseInt(info.element.style.zIndex || 0, 10);
            if (z > maxZ) {
                maxZ = z;
                topModalId = id;
            }
        }
    });
    if (topModalId) {
        closeModal(topModalId);
    }
});


/**
 * ===================================================================
 * III. 퀵마크 (자주 쓰는 코멘트) 관리 로직 (from ver.1.25)
 * ===================================================================
 */

const quickMarkPopover = document.getElementById('quickmark-popover');
const quickMarkList = document.getElementById('quickmark-list');

function renderQuickMarkPopover() {
    if(!quickMarkList) return;
    quickMarkList.innerHTML = professorData.quickMarks.map(qm => `
        <div class="quickmark-item flex items-center p-2 hover:bg-gray-100 rounded-md" data-content="${qm.content}">
            <div class="flex-grow cursor-pointer">
                <p class="font-semibold text-sm text-gray-800">${qm.title}</p>
                <p class="text-xs text-gray-500 truncate">${qm.content}</p>
            </div>
            <button class="quickmark-delete-btn text-gray-400 hover:text-red-500 ml-2 p-1" data-id="${qm.id}" title="삭제">
                <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>`).join('');
}

function showQuickMarkPopover(targetButton) {
    const targetId = targetButton.dataset.target;
    if (!quickMarkPopover) return;
    
    quickMarkPopover.dataset.target = targetId;
    const rect = targetButton.getBoundingClientRect();
    
    // 팝오버 위치 계산 (화면 경계 고려)
    const popoverWidth = quickMarkPopover.offsetWidth || 320;
    const popoverHeight = quickMarkPopover.offsetHeight || 400;
    
    let top = window.scrollY + rect.bottom + 5;
    let left = window.scrollX + rect.left;

    if (left + popoverWidth > window.innerWidth) {
        left = window.scrollX + rect.right - popoverWidth;
    }
    if (top + popoverHeight > window.innerHeight + window.scrollY) {
        top = window.scrollY + rect.top - popoverHeight - 5;
    }
    if (top < 0) top = 10;
    if (left < 0) left = 10;

    quickMarkPopover.style.top = `${top}px`;
    quickMarkPopover.style.left = `${left}px`;
    
    const targetTextarea = document.getElementById(targetId);
    const addFromTextAreaSection = document.getElementById('add-from-textarea-section');
    if (targetTextarea && targetTextarea.value.trim().length > 0) {
        addFromTextAreaSection.classList.remove('hidden');
    } else {
        addFromTextAreaSection.classList.add('hidden');
    }
    document.getElementById('quickmark-title-from-text').value = '';

    quickMarkPopover.classList.remove('hidden');
}

function hideQuickMarkPopover() { 
    if(quickMarkPopover) quickMarkPopover.classList.add('hidden'); 
}

// 퀵마크 팝오버 이벤트 리스너 (팝오버 내부 클릭 처리)
if (quickMarkPopover) {
    quickMarkPopover.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.quickmark-delete-btn');
        const item = e.target.closest('.quickmark-item');
        const addBtn = e.target.closest('#add-quickmark-btn');
        const addFromTextBtn = e.target.closest('#add-quickmark-from-text-btn');

        if (deleteBtn) {
            e.stopPropagation();
            const id = deleteBtn.dataset.id;
            if (confirm('이 코멘트를 삭제하시겠습니까?')) {
                professorData.quickMarks = professorData.quickMarks.filter(qm => qm.id !== id);
                renderQuickMarkPopover();
            }
        } else if (item) {
            const content = item.dataset.content;
            const targetTextarea = document.getElementById(quickMarkPopover.dataset.target);
            if (targetTextarea) {
                targetTextarea.value += (targetTextarea.value ? '\n' : '') + content;
                targetTextarea.focus();
            }
            hideQuickMarkPopover();
        } else if (addBtn) {
            const title = document.getElementById('quickmark-new-title').value.trim();
            const content = document.getElementById('quickmark-new-content').value.trim();
            if (!title || !content) { alert('제목과 내용을 모두 입력해주세요.'); return; }
            professorData.quickMarks.push({ id: `qm-${Date.now()}`, title, content });
            renderQuickMarkPopover();
            document.getElementById('quickmark-new-title').value = '';
            document.getElementById('quickmark-new-content').value = '';
        } else if (addFromTextBtn) {
            const title = document.getElementById('quickmark-title-from-text').value.trim();
            const targetTextarea = document.getElementById(quickMarkPopover.dataset.target);
            const content = targetTextarea ? targetTextarea.value.trim() : '';

            if (!title || !content) { alert('제목을 입력하고, 저장할 내용이 있는지 확인해주세요.'); return; }
            professorData.quickMarks.push({ id: `qm-${Date.now()}`, title, content });
            renderQuickMarkPopover();
            document.getElementById('quickmark-title-from-text').value = '';
            hideQuickMarkPopover();
        }
    });
}

// 퀵마크 팝오버 닫기 (외부 클릭)
document.addEventListener('click', (e) => {
    if (quickMarkPopover && !quickMarkPopover.classList.contains('hidden') && !e.target.closest('.quickmark-btn') && !e.target.closest('#quickmark-popover')) {
        hideQuickMarkPopover();
    }
});


/**
 * ===================================================================
 * IV. 뷰(View)별 특화 모달 함수
 * (학생 관리, 랩미팅 등)
 * ===================================================================
 */

/**
 * [학생 관리] 학생 상세 정보 모달 (from ver.1.996)
 * @param {string} studentId - 'std-01'과 같은 학생 데이터 ID
 */
function showStudentInfoModal(studentId) {
    const student = professorData.students.find(s => s.id === studentId);
    if (!student) return;
    
    openModal('student-info-modal', () => {
        const modal = modals['student-info-modal'].element;
        modal.querySelector('#info-name').textContent = student.name;
        modal.querySelector('#info-student-id').textContent = student.studentId;
        modal.querySelector('#info-degree').textContent = student.degree;
        modal.querySelector('#info-phone').textContent = student.phone;
        modal.querySelector('#info-email').textContent = student.email;
    });
}

/**
 * [학생 관리] 알림 발송 모달 (from ver.1.996)
 */
function showNotificationModal() {
    const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
    const recipients = Array.from(checkedBoxes).map(cb => cb.dataset.studentName).join(', ');
    
    openModal('notification-modal', () => {
        const modal = modals['notification-modal'].element;
        modal.querySelector('#notification-recipients').textContent = recipients || '선택된 학생이 없습니다.';
        
        const tabs = modal.querySelectorAll('.notification-tab');
        const panels = modal.querySelectorAll('.notification-panel');
        
        tabs.forEach(tab => {
            // 기존 이벤트 리스너 제거 (중복 방지)
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);

            // 새 리스너 할당
            newTab.addEventListener('click', () => {
                modal.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active'));
                newTab.classList.add('active');
                panels.forEach(p => p.classList.add('hidden'));
                modal.querySelector(`#${newTab.dataset.tab}-content`).classList.remove('hidden');
            });
        });
        
        // 첫 번째 탭을 활성화
        if (tabs.length > 0) {
            modal.querySelector('.notification-tab[data-tab="email"]').click();
        }
    });
}

/**
 * [학생 관리] 지도 계획 목록 렌더링 (from ver.1.996)
 * @param {string} studentId - 학생 데이터 ID
 */
function renderPlanList(studentId) {
    const student = professorData.students.find(s => s.id === studentId);
    const container = document.getElementById('plan-list-container');
    if (!student || !container) return;

    if (student.plans.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-4">등록된 지도 계획이 없습니다.</p>`;
        return;
    }
    
    container.innerHTML = `
        <table class="min-w-full text-sm">
            <thead class="bg-gray-100">
                <tr>
                    <th class="py-2 px-3 text-left font-semibold text-gray-600">회차</th>
                    <th class="py-2 px-3 text-left font-semibold text-gray-600">예상 지도일</th>
                    <th class="py-2 px-3 text-left font-semibold text-gray-600">지도 주제</th>
                    <th class="py-2 px-3 text-left font-semibold text-gray-600">지도 방식</th>
                </tr>
            </thead>
            <tbody>
                ${student.plans.map(p => `
                    <tr class="border-b">
                        <td class="py-2 px-3">${p.session}</td>
                        <td class="py-2 px-3">${p.date}</td>
                        <td class="py-2 px-3">${p.topic}</td>
                        <td class="py-2 px-3">${p.method}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

/**
 * [학생 관리] 지도 계획 모달 (from ver.1.996)
 * @param {string} studentId - 학생 데이터 ID
 */
function showPlanModal(studentId) {
    const student = professorData.students.find(s => s.id === studentId);
    if (!student) return;

    openModal('plan-modal', () => {
        const modal = modals['plan-modal'].element;
        modal.querySelector('#plan-modal-title').textContent = `[${student.name}] 학생 논문 지도 계획`;
        const form = modal.querySelector('#add-plan-form');
        form.dataset.studentId = studentId; // 폼에 학생 ID 저장
        form.reset();
        renderPlanList(studentId); // 목록 렌더링
    });
}

/**
 * [학생 관리] 지도 실적 모달 (from ver.1.996)
 * @param {string} studentId - 학생 데이터 ID
 */
function showRecordModal(studentId) {
    const student = professorData.students.find(s => s.id === studentId);
    if (!student) return;

    openModal('record-modal', () => {
        const modal = modals['record-modal'].element;
        modal.querySelector('#record-modal-title').textContent = `[${student.name}] 학생 논문 지도 실적`;
        const contentEl = modal.querySelector('#record-modal-content');
        
        // (ver.1.995의 데이터를 ver.1.996의 형식으로 조합)
        const meetings = professorData.meetings.filter(m => m.studentId === studentId && m.status === '완료');
        const feedbacks = professorData.feedbackRequests.filter(f => f.studentId === studentId && f.status === '피드백 완료');
        
        const records = [
            ...meetings.map(m => ({ 
                date: m.date, 
                method: m.type, 
                content: m.summary, 
                attachment: m.recordingUrl ? '녹화영상' : '-',
                attendance: '참석', // (샘플 데이터)
                duration: '60분'  // (샘플 데이터)
            })), 
            ...feedbacks.map(f => ({ 
                date: f.date, 
                method: '온라인', 
                content: `${f.stage} - ${f.title}`, 
                attachment: f.file,
                attendance: '-',
                duration: '-'
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)); // 날짜순 정렬

        if (records.length === 0) {
            contentEl.innerHTML = `<p class="text-center text-gray-500 py-8">조회된 지도 실적이 없습니다.</p>`;
        } else {
            contentEl.innerHTML = `
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="py-2 px-3 text-left font-semibold text-gray-600">지도일</th>
                                <th class="py-2 px-3 text-left font-semibold text-gray-600">지도 방식</th>
                                <th class="py-2 px-3 text-left font-semibold text-gray-600">지도 내용 요약</th>
                                <th class="py-2 px-3 text-left font-semibold text-gray-600">첨부 자료</th>
                                <th class="py-2 px-3 text-left font-semibold text-gray-600">참석 여부</th>
                                <th class="py-2 px-3 text-left font-semibold text-gray-600">소요 시간</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${records.map(r => `
                                <tr class="border-b">
                                    <td class="py-3 px-3">${r.date}</td>
                                    <td class="py-3 px-3">${r.method}</td>
                                    <td class="py-3 px-3">${r.content}</td>
                                    <td class="py-3 px-3">${r.attachment}</td>
                                    <td class="py-3 px-3">${r.attendance}</td>
                                    <td class="py-3 px-3">${r.duration}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`;
        }
    });
}