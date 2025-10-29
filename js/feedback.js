// (주의) 이 파일은 UTF-8 형식으로 저장되어야 한글이 깨지지 않습니다.
// 메모장에서 저장 시 '인코딩'을 'UTF-8'로 설정하세요.

/**
 * ===================================================================
 * V. 온라인 피드백 모듈 (from ver.1.26 Final - 수정본)
 * (가장 무겁고 복잡한 로직)
 * ===================================================================
 */

// common.js의 closeModal에서 참조할 수 있도록 전역 스코프에 핸들러 변수 선언
let activeKeyDownHandler = null;
// common.js에서 참조할 수 있도록 첨부파일 핸들러 객체 선언
const attachmentHandlers = {}; 

/**
 * [피드백] 버전 선택 모달을 표시 (from ver.1.25)
 * @param {string} documentId - 'doc-kim-final'과 같은 문서 고유 ID
 */
function showVersionSelector(documentId) {
    openModal('version-select-modal', () => { // common.js 함수
        const listEl = document.getElementById('version-select-list');
        const versions = professorData.feedbackRequests
            .filter(f => f.documentId === documentId)
            .sort((a, b) => b.version - a.version); // 버전 역순 정렬 (최신순)
        
        if (!listEl) return;
        
        const latestVersion = versions[0];

        listEl.innerHTML = versions.map(v => {
            const isLatest = v.version === latestVersion.version;
            // 최신 버전이고, 아직 답변 대기중일 때만 'edit' 모드
            const mode = (isLatest && v.status === '답변 대기중') ? 'edit' : 'readonly';
            
            let tag = '';
            if (isLatest) {
                tag = `<span class="text-xs text-white bg-blue-600 rounded-full px-2 py-0.5 ml-2">최신</span>`;
            } else if (v.status === '피드백 완료') {
                tag = `<span class="text-xs text-green-700 bg-green-100 rounded-full px-2 py-0.5 ml-2">완료</span>`;
            }

            return `
            <div class="border-b p-3 hover:bg-gray-50 cursor-pointer" data-feedback-id="${v.id}" data-mode="${mode}">
                <p class="font-bold text-gray-800">Version ${v.version} ${tag}</p>
                <p class="text-sm text-gray-500">${v.file} (${v.date})</p>
                <p class="text-xs text-gray-500 mt-1">상태: ${v.status}</p>
            </div>`;
        }).join('');

        // 각 버전에 클릭 이벤트 할당
        listEl.querySelectorAll('div[data-feedback-id]').forEach(item => {
            item.addEventListener('click', () => {
                closeModal('version-select-modal'); // common.js
                // feedback.js의 showFeedbackDetails를 호출
                showFeedbackDetails(item.dataset.feedbackId, item.dataset.mode);
            });
        });
    });
}


/**
 * [피드백] 댓글 스레드를 HTML로 렌더링 (from ver.1.25)
 * @param {Array} threadData - 댓글 객체 배열
 * @param {string} studentName - 학생 이름 (교수 댓글과 구분하기 위함)
 * @returns {string | null} 렌더링된 HTML 문자열 또는 null
 */
function renderCommentThread(threadData, studentName) {
    if (!threadData || threadData.length === 0) return null;
    
    return threadData.map(comment => {
        const isProfessor = comment.author !== studentName;
        const attachmentsHTML = (comment.attachments || []).map(file => `
            <a href="${file.fileUrl}" target="_blank" class="flex items-center text-sm mt-2 text-gray-600 attachment-link">
                <i class="fas fa-paperclip mr-2"></i> ${file.fileName}
            </a>
        `).join('');
        const audioHTML = comment.audio ? `<audio controls class="w-full h-8 mt-2" src="${comment.audio}"></audio>` : '';

        return `
            <div class="flex flex-col ${isProfessor ? 'items-end' : 'items-start'}">
                <div class="comment-bubble ${isProfessor ? 'professor-comment' : 'student-comment'}">
                    <div class="author">${comment.author}</div>
                    <p>${comment.text || '(내용 없음)'}</p>
                    ${audioHTML}
                    <div class="attachment-list">${attachmentsHTML}</div>
                    <div class="timestamp mt-2 ${isProfessor ? 'text-left' : 'text-right'}">${comment.timestamp}</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * [피드백] 파일 첨부 핸들러 설정 (from ver.1.25)
 * @param {string} key - 핸들러를 식별할 고유 키 (예: 'general' 또는 annotation ID)
 * @param {HTMLElement} btn - 파일 첨부 버튼
 * @param {HTMLElement} input - 숨겨진 file input 요소
 * @param {HTMLElement} list - 파일 목록을 표시할 div 요소
 */
function setupAttachmentHandlers(key, btn, input, list) {
    if (!btn || !input || !list) return;

    // 전역 attachmentHandlers 객체에 파일 목록 저장
    attachmentHandlers[key] = { files: [] };

    const renderAttachments = () => {
        list.innerHTML = '';
        attachmentHandlers[key].files.forEach(file => {
            const fileEl = document.createElement('div');
            fileEl.className = 'flex items-center justify-between bg-gray-100 p-1 rounded';
            fileEl.innerHTML = `
                <span class="text-gray-700 text-xs"><i class="fas fa-file-alt mr-2"></i>${file.name}</span>
                <button type="button" class="text-red-500 text-xs remove-attachment-btn" data-filename="${file.name}">&times;</button>
            `;
            list.appendChild(fileEl);
        });
    }
    
    // 버튼 클릭 시 input 클릭
    btn.addEventListener('click', () => input.click());
    
    // 파일 선택 시
    input.addEventListener('change', (e) => {
        Array.from(e.target.files).forEach(file => {
            // 중복 파일 체크 (선택 사항)
            if (!attachmentHandlers[key].files.some(f => f.name === file.name)) {
                attachmentHandlers[key].files.push(file);
            }
        });
        renderAttachments();
        input.value = ''; // input 초기화
    });

    // 파일 제거
    list.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-attachment-btn')) {
            const filename = e.target.dataset.filename;
            attachmentHandlers[key].files = attachmentHandlers[key].files.filter(f => f.name !== filename);
            renderAttachments();
        }
    });
}


/**
 * [피드백] PDF 뷰어 초기화 (from ver.1.26 Final - 수정본)
 * @param {HTMLElement} modalContentEl - 모달의 콘텐츠 영역 DOM
 * @param {Object} savedAnnotations - 저장된 첨삭 데이터
 * @param {string} mode - 'edit' 또는 'readonly'
 * @returns {Object} 뷰어 제어 객체
 */
function initializePdfViewer(modalContentEl, savedAnnotations = {}, mode = 'edit') {
    const isReadonly = mode === 'readonly';
    // 샘플 PDF URL (실제로는 feedback 객체에서 받아와야 함)
    const url = 'https://raw.githubusercontent.com/lemonsnack-rgb/pdftext/main/000000089936_20250918121053.pdf';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js`;

    let pdfDoc = null, pageNum = 1, pageRendering = false, pageNumPending = null, currentTool = 'select';
    let currentScale = 1.5; // PDF 렌더링 배율
    let prevPageNum = 1;

    // 모달 내부의 DOM 요소 캐싱
    const elements = {
        pdfRenderWrapper: modalContentEl.querySelector('#pdf-render-wrapper'),
        pdfRenderArea: modalContentEl.querySelector('#pdf-render-area'),
        canvas: modalContentEl.querySelector('#pdf-canvas'),
        textLayer: modalContentEl.querySelector('#text-layer'),
        interactionCanvas: modalContentEl.querySelector('#interaction-canvas'),
        markerContainer: modalContentEl.querySelector('#marker-container'),
        pageNumEl: modalContentEl.querySelector('#page-num'),
        pageCountEl: modalContentEl.querySelector('#page-count'),
        zoomLevelEl: modalContentEl.querySelector('#zoom-level'),
        toolButtons: {
            select: modalContentEl.querySelector('#select-tool'),
            comment: modalContentEl.querySelector('#comment-tool'),
            highlight: modalContentEl.querySelector('#highlight-tool'),
            drawing: modalContentEl.querySelector('#drawing-tool'),
            eraser: modalContentEl.querySelector('#eraser-tool'),
        }
    };
    
    // 첨삭 데이터 (깊은 복사로 원본 데이터 오염 방지)
    let annotations = JSON.parse(JSON.stringify(savedAnnotations || {}));
    
    // Fabric.js 캔버스 초기화
    const fabricCanvas = new fabric.Canvas(elements.interactionCanvas, { 
        isDrawingMode: false,
        perPixelTargetFind: true // 판서 등 불규칙한 객체 선택에 유리
    });
    fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
    
    let isDrawingRect, origX, origY, tempRect, eraserRect = null, isErasing = false;
    
    /**
     * 지정된 페이지 렌더링
     */
    async function renderPage(num) {
        pageRendering = true;
        if(!pdfDoc) return;
        
        try {
            const page = await pdfDoc.getPage(num);
            const viewport = page.getViewport({ scale: currentScale });
            const context = elements.canvas.getContext('2d');
            
            // 모든 레이어(PDF, 텍스트, 첨삭, 마커)의 크기 및 배율 동기화
            elements.canvas.height = viewport.height; 
            elements.canvas.width = viewport.width;
            elements.textLayer.style.width = `${viewport.width}px`; 
            elements.textLayer.style.height = `${viewport.height}px`;
            elements.markerContainer.style.width = `${viewport.width}px`; 
            elements.markerContainer.style.height = `${viewport.height}px`;
            fabricCanvas.setDimensions({ width: viewport.width, height: viewport.height });
            // [v1.26 수정] Fabric 캔버스 줌 설정 (좌표계 일치)
            fabricCanvas.setZoom(currentScale); 

            // 렌더링 태스크와 텍스트 레이어 병렬 처리
            const renderTask = page.render({ canvasContext: context, viewport: viewport });
            const textContent = await page.getTextContent();

            // 텍스트 레이어 렌더링 (텍스트 선택 및 드래그용)
            elements.textLayer.innerHTML = ''; // 이전 내용 초기화
            pdfjsLib.renderTextLayer({ 
                textContent: textContent, 
                container: elements.textLayer, 
                viewport: viewport, 
                textDivs: [] 
            });
            
            await renderTask.promise;
            pageRendering = false;
            
            // 페이지 이동 시 스크롤 상단으로
            if (num !== prevPageNum) elements.pdfRenderWrapper.scrollTop = 0;
            prevPageNum = num;

            // 페이지 렌더링 완료 후 대기 중인 페이지가 있으면 렌더링
            if (pageNumPending !== null) { 
                renderPage(pageNumPending); 
                pageNumPending = null; 
            }
            
            // 이 페이지에 해당하는 첨삭 로드
            loadAnnotationsForPage(num);

            elements.pageNumEl.textContent = num;
            elements.zoomLevelEl.textContent = `${Math.round(currentScale * 100)}%`;

        } catch(error) {
            console.error("PDF 페이지 렌더링 실패:", error);
            pageRendering = false;
        }
    }

    /**
     * 페이지 렌더링 큐
     */
    const queueRenderPage = (num) => { 
        if (pageRendering) {
            pageNumPending = num; 
        } else { 
            pageNum = num; 
            renderPage(num); 
        } 
    };
    
    // PDF 래퍼 영역 휠 이벤트 (페이지 넘김)
    elements.pdfRenderWrapper.addEventListener('wheel', (event) => {
        const wrapper = event.currentTarget;
        // 스크롤이 맨 아래이고, 아래로 휠을 내릴 때
        const atBottom = wrapper.scrollTop + wrapper.clientHeight >= wrapper.scrollHeight - 5;
        // 스크롤이 맨 위이고, 위로 휠을 올릴 때
        const atTop = wrapper.scrollTop === 0;

        if (event.deltaY > 0 && atBottom) { // 아래로 스크롤
            event.preventDefault();
            if (!pageRendering && pdfDoc && pageNum < pdfDoc.numPages) queueRenderPage(pageNum + 1);
        } else if (event.deltaY < 0 && atTop) { // 위로 스크롤
            event.preventDefault();
            if (!pageRendering && pageNum > 1) queueRenderPage(pageNum - 1);
        }
        // 그 외의 경우는 기본 스크롤 동작 허용
    }, { passive: false }); // passive: false로 preventDefault() 활성화

    // PDF 툴바 버튼 이벤트
    modalContentEl.querySelector('#prev-page').addEventListener('click', () => { if (pageNum > 1) queueRenderPage(pageNum - 1); });
    modalContentEl.querySelector('#next-page').addEventListener('click', () => { if (pdfDoc && pageNum < pdfDoc.numPages) queueRenderPage(pageNum + 1); });
    
    modalContentEl.querySelector('#zoom-in-btn').addEventListener('click', () => { 
        currentScale = Math.min(3.0, currentScale + 0.2); // 최대 300%
        renderPage(pageNum);
    });
    modalContentEl.querySelector('#zoom-out-btn').addEventListener('click', () => { 
        currentScale = Math.max(0.5, currentScale - 0.2); // 최소 50%
        renderPage(pageNum);
    });
    modalContentEl.querySelector('#fit-page-btn').addEventListener('click', async () => {
        if (!pdfDoc) return;
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        // 래퍼 높이에 맞게 스케일 조정 (패딩 고려)
        currentScale = (elements.pdfRenderWrapper.clientHeight - 40) / viewport.height;
        renderPage(pageNum);
    });
    
    /**
     * [첨삭] 코멘트 마커(#) 렌더링 (from ver.1.26 Final)
     */
    function redrawMarkersForPage(num) {
        elements.markerContainer.innerHTML = '';
        if (!annotations) return;

        let commentCounter = 1;
        // 페이지 번호순으로 정렬
        const sortedPageKeys = Object.keys(annotations).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

        for (const pageKey of sortedPageKeys) {
            const pageInt = parseInt(pageKey, 10);
            if (annotations[pageKey]) {
                const pageComments = annotations[pageKey].filter(a => a.customType === 'comment');
                if (pageInt < num) {
                    commentCounter += pageComments.length;
                } else if (pageInt === num) {
                    pageComments.forEach(comment => {
                        // [v1.26 수정] 텍스트 드래그(group)와 영역 박스(rect)의 좌표 계산 방식 분리
                        // [v1.26 수정] 마커 위치에 현재 스케일(currentScale)을 곱해줌
                        const left = (comment.type === 'group' ? comment.left + comment.objects[0].left : comment.left) * currentScale;
                        const top = (comment.type === 'group' ? comment.top + comment.objects[0].top : comment.top) * currentScale;
                        
                        const marker = document.createElement('div');
                        marker.className = 'comment-marker';
                        marker.dataset.annotationId = comment.id;
                        marker.textContent = commentCounter;
                        marker.style.left = `${left}px`;
                        marker.style.top = `${top}px`;
                        elements.markerContainer.appendChild(marker);
                        commentCounter++;
                    });
                }
            }
        }
    }
    
    /**
     * [첨삭] 판서/하이라이트 지우기 (from ver.1.25)
     */
    const eraseObjectAtPointer = (e) => {
        const pointer = fabricCanvas.getPointer(e);
        let somethingRemoved = false;
        
        for (let i = fabricCanvas.getObjects().length - 1; i >= 0; i--) {
            const obj = fabricCanvas.getObjects()[i];
            // 판서(drawing) 또는 하이라이트(highlight)만 지우도록 제한
            if (obj && obj.id && (obj.customType === 'drawing' || obj.customType === 'highlight') && obj.containsPoint(pointer)) {
                fabricCanvas.remove(obj);

                // annotations 데이터에서도 삭제
                for (const pageNumKey in annotations) {
                   if (annotations[pageNumKey]) {
                       const initialLength = annotations[pageNumKey].length;
                       annotations[pageNumKey] = annotations[pageNumKey].filter(anno => anno.id !== obj.id);
                       if (annotations[pageNumKey].length < initialLength) {
                           somethingRemoved = true;
                           break; // 찾아서 지웠으면 루프 종료
                       }
                   }
                }
                if (somethingRemoved) break; 
            }
        }
        
        if (somethingRemoved) {
            fabricCanvas.renderAll();
            // 댓글 목록 UI 갱신 (페이지 마커 제거 등)
            modalContentEl.dispatchEvent(new CustomEvent('annotationsChanged'));
        }
    };

    /**
     * [첨삭] 툴 변경 (from ver.1.25)
     */
    const setTool = (tool) => {
        if(isReadonly) return;
        
        currentTool = tool; 
        Object.values(elements.toolButtons).forEach(btn => btn.classList.remove('active'));
        if(elements.toolButtons[tool]) elements.toolButtons[tool].classList.add('active');
        
        fabricCanvas.isDrawingMode = ['highlight', 'drawing'].includes(tool);
        fabricCanvas.selection = tool === 'select';
        
        // '선택' 툴일 때만 객체 선택 가능
        fabricCanvas.getObjects().forEach(obj => { 
            if(obj !== eraserRect) obj.set({ selectable: tool === 'select', evented: tool === 'select' }); 
        });
        
        // '선택' 툴일 때만 텍스트 레이어 활성화
        elements.textLayer.classList.toggle('active', tool === 'select');
        // '선택' 툴 외에는 인터랙션 캔버스 활성화 (마우스 이벤트 받기)
        const canvasContainer = fabricCanvas.upperCanvasEl.parentElement;
        canvasContainer.classList.toggle('interaction-active', !['select'].includes(tool));

        let cursorStyle = 'default';
        if (eraserRect) eraserRect.visible = false;

        switch (tool) {
            case 'comment': cursorStyle = 'crosshair'; break;
            case 'highlight': case 'drawing': cursorStyle = 'cell'; break;
            case 'eraser':
                cursorStyle = 'none';
                if (!eraserRect) { 
                    eraserRect = new fabric.Rect({ 
                        width: 20, height: 20, fill: 'rgba(0,0,0,0.2)', 
                        absolutePositioned: true, selectable: false, evented: false 
                    }); 
                    fabricCanvas.add(eraserRect); 
                }
                eraserRect.visible = true;
                break;
        }
        fabricCanvas.defaultCursor = cursorStyle;
        fabricCanvas.upperCanvasEl.style.cursor = cursorStyle;

        // 브러시 설정
        if (tool === 'highlight') { 
            fabricCanvas.freeDrawingBrush.color = 'rgba(255, 255, 0, 0.4)'; 
            fabricCanvas.freeDrawingBrush.width = 15; 
        } else if (tool === 'drawing') { 
            fabricCanvas.freeDrawingBrush.color = 'rgba(220, 38, 38, 0.9)'; 
            fabricCanvas.freeDrawingBrush.width = 2; 
        }
        fabricCanvas.renderAll();
    };
    
    /**
     * [첨삭] annotations 데이터 객체에 새 첨삭 추가 (from ver.1.25)
     */
    function addAnnotation(obj, customType, id) { 
        if (!annotations[pageNum]) annotations[pageNum] = []; 
        
        obj.id = id; 
        obj.customType = customType;
        
        // Fabric 객체를 직렬화하여 순수 JSON 객체로 저장
        const annotationData = obj.toObject(['id', 'left', 'top', 'width', 'height', 'path', 'fill', 'stroke', 'strokeWidth', 'customType', 'objects']); 
        
        if(customType === 'comment') { 
            annotationData.comments = []; // 댓글 스레드 초기화
            annotationData.linkedComments = []; // 연결된 코멘트 초기화
        } 
        annotations[pageNum].push(annotationData); 
    }

    // (읽기 전용이 아닐 경우) 첨삭 관련 이벤트 리스너 바인딩
    if(!isReadonly) {
        Object.entries(elements.toolButtons).forEach(([toolName, button]) => { 
            if(button) button.addEventListener('click', () => setTool(toolName));
        });
        
        fabricCanvas.on('mouse:down', (o) => { 
            if (isReadonly) return; 
            if (currentTool === 'comment') { // 코멘트 영역 그리기 시작
                isDrawingRect = true; 
                const pointer = fabricCanvas.getPointer(o.e); 
                origX = pointer.x; origY = pointer.y; 
                tempRect = new fabric.Rect({ 
                    left: origX, top: origY, originX: 'left', originY: 'top', 
                    width: 0, height: 0, fill: 'rgba(106, 0, 40, 0.1)', 
                    stroke: 'rgba(106, 0, 40, 0.8)', strokeWidth: 2, selectable: false 
                }); 
                fabricCanvas.add(tempRect); 
            } else if (currentTool === 'eraser') { // 지우개 시작
                isErasing = true; 
                eraseObjectAtPointer(o.e); 
            } 
        });

        fabricCanvas.on('mouse:move', (o) => { 
            if (isReadonly) return; 
            const p = fabricCanvas.getPointer(o.e); 
            // 지우개 커서 이동
            if (eraserRect) eraserRect.set({ left: p.x - eraserRect.width/2, top: p.y - eraserRect.height/2 }).setCoords(); 
            
            if (isDrawingRect && currentTool === 'comment') { // 코멘트 영역 그리기
                tempRect.set({ 
                    width: Math.abs(origX - p.x), 
                    height: Math.abs(origY - p.y), 
                    left: Math.min(origX, p.x), 
                    top: Math.min(origY, p.y) 
                }); 
            } else if (isErasing && currentTool === 'eraser') { // 지우개 드래그
                eraseObjectAtPointer(o.e); 
            } 
            fabricCanvas.renderAll(); 
        });

        fabricCanvas.on('mouse:up', () => { 
            if (isReadonly) return; 
            isErasing = false; 
            if (isDrawingRect && currentTool === 'comment') { // 코멘트 영역 그리기 완료
                isDrawingRect = false; 
                if (!tempRect || tempRect.width < 5 || tempRect.height < 5) { 
                    if(tempRect) fabricCanvas.remove(tempRect); // 너무 작으면 제거
                    return; 
                } 
                
                // 임시 사각형을 최종 사각형으로 변환
                const newRect = new fabric.Rect({ ...tempRect.toObject(), isCommentRect: true, selectable: false, evented: false });
                fabricCanvas.remove(tempRect);
                fabricCanvas.add(newRect);
                
                addAnnotation(newRect, 'comment', `anno-${Date.now()}`); 
                // UI 갱신 (댓글 카드 생성, 마커 표시)
                modalContentEl.dispatchEvent(new CustomEvent('annotationsChanged'));
                setTool('select'); // 툴을 선택으로 자동 변경
            } 
        });
        
        // [v1.26 수정] 텍스트 레이어에서 텍스트 드래그 완료 시
        elements.textLayer.addEventListener('mouseup', () => {
            if (isReadonly || currentTool !== 'select') return;
            const selection = window.getSelection();
            if (!selection.rangeCount || selection.isCollapsed) return;
            
            const range = selection.getRangeAt(0);
            const clientRects = range.getClientRects();
            const canvasRect = elements.canvas.getBoundingClientRect();

            if (clientRects.length === 0) return;

            const rects = [];
            for (let i = 0; i < clientRects.length; i++) {
                const r = clientRects[i];
                // [v1.26 수정] PDF 캔버스 기준 좌표로 변환 (현재 스케일 값으로 나눠줌)
                rects.push(new fabric.Rect({
                    left: (r.left - canvasRect.left) / currentScale,
                    top: (r.top - canvasRect.top) / currentScale,
                    width: r.width / currentScale,
                    height: r.height / currentScale,
                    fill: 'rgba(106, 0, 40, 0.1)',
                    stroke: 'rgba(106, 0, 40, 0.8)',
                    strokeWidth: 1,
                }));
            }
            
            // 드래그된 텍스트 영역들을 그룹으로 묶음
            const group = new fabric.Group(rects, {
                isCommentRect: true,
                selectable: false,
                evented: false,
            });

            fabricCanvas.add(group);
            addAnnotation(group, 'comment', `anno-${Date.now()}`);
            modalContentEl.dispatchEvent(new CustomEvent('annotationsChanged'));
            selection.removeAllRanges(); // 텍스트 선택 해제
        });

        // 판서/하이라이트 완료 시
        fabricCanvas.on('path:created', (e) => { 
            if (isReadonly || (currentTool !== 'highlight' && currentTool !== 'drawing')) return; 
            e.path.set({ selectable: true, evented: true }); // 선택 가능하도록
            addAnnotation(e.path, currentTool, `anno-${Date.now()}`);
            modalContentEl.dispatchEvent(new CustomEvent('annotationsChanged'));
        });
    }
    
    /**
     * [첨삭] 현재 페이지의 첨삭 데이터를 Fabric 캔버스에 로드 (from ver.1.25)
     */
    function loadAnnotationsForPage(num) {
        // 캔버스 초기화 (지우개 커서 제외)
        fabricCanvas.getObjects().forEach(obj => { if (obj !== eraserRect) fabricCanvas.remove(obj); });
        
        if (annotations[num]) {
            // 저장된 JSON 데이터를 Fabric 객체로 변환
            fabric.util.enlivenObjects(annotations[num], (objects) => {
               objects.forEach((obj) => {
                    // 현재 툴 상태에 맞게 선택 가능 여부 설정
                    obj.set({
                        selectable: !isReadonly && currentTool === 'select',
                        evented: !isReadonly && currentTool === 'select'
                    });
                    fabricCanvas.add(obj); 
                });
               fabricCanvas.renderAll();
            });
        }
        // 코멘트 마커(#) 다시 그리기
        redrawMarkersForPage(num);
    }
    
    // PDF 문서 로드 시작
    pdfjsLib.getDocument(url).promise.then(async pdf => { 
        pdfDoc = pdf; 
        elements.pageCountEl.textContent = pdfDoc.numPages; 
        
        // 첫 페이지 로드 시 '페이지 맞춤'으로 스케일 계산
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        currentScale = (elements.pdfRenderWrapper.clientHeight - 40) / viewport.height;
        
        renderPage(pageNum); 
        setTool('select'); 
    }).catch(err => { 
        console.error("PDF 로딩 실패:", err); 
        elements.pdfRenderArea.innerHTML = `<div class="p-8 text-center bg-white"><p class="font-bold text-red-600">PDF 문서를 불러오는 데 실패했습니다.</p></div>`;
    });

    // 뷰어 제어 함수들 반환
    return { annotations, fabricCanvas, queueRenderPage, redrawMarkersForPage, addAnnotation };
}

/**
 * [피드백] 모달의 모든 이벤트 리스너 설정 (from ver.1.25)
 * @param {HTMLElement} modalContentEl - 모달의 콘텐츠 영역 DOM
 * @param {Object} context - 뷰어 제어 객체 및 피드백 정보
 */
function setupModalEventListeners(modalContentEl, context) {
    const { annotations, fabricCanvas, queueRenderPage, redrawMarkersForPage, feedbackId, isReadonly, feedback } = context;

    let mediaRecorder, audioChunks = [], recordingTimeout;
    let linkingState = { active: false, sourceId: null }; // 코멘트 연결 상태

    /**
     * ID로 첨삭 데이터 찾기
     */
    const findAnnotationById = (id) => {
        for (const pageKey in annotations) {
            if (annotations[pageKey]) {
                const found = annotations[pageKey].find(anno => anno.id === id);
                if (found) return { annotation: found, page: pageKey };
            }
        }
        return null;
    };

    /**
     * 음성 녹음 처리
     */
    const handleVoiceRecording = async (button) => {
        const annotationId = button.dataset.annotationId;
        const timerEl = button.querySelector('.record-timer');

        if (button.classList.contains('recording')) { 
            if(mediaRecorder) mediaRecorder.stop(); 
            return; 
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream); 
            audioChunks = [];
            mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const result = findAnnotationById(annotationId);
                    if(result) {
                        const annotation = result.annotation;
                        if(!annotation.comments) annotation.comments = [];
                        const now = new Date();
                        const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
                        
                        // 음성 메모를 댓글 스레드에 추가
                        annotation.comments.push({
                            id: `cm-${Date.now()}`, author: '박교수', text: `(음성메모)`,
                            audio: reader.result, timestamp: timestamp, attachments: []
                        });
                        renderAllComments(); // 댓글 목록 UI 갱신
                    }
                };
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start(); 
            button.classList.add('recording');
            let seconds = 0;
            const timerInterval = setInterval(() => { 
                seconds++; 
                if(timerEl) timerEl.textContent = `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`; 
            }, 1000);
            
            // 60초 제한
            recordingTimeout = setTimeout(() => { if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop(); }, 60000);
            
            mediaRecorder.addEventListener('stop', () => { 
                button.classList.remove('recording'); 
                clearTimeout(recordingTimeout); 
                clearInterval(timerInterval); 
                if(timerEl) timerEl.textContent = '00:00'; 
            }, { once: true });
        } catch (err) { 
            console.error("마이크 접근 오류:", err);
            alert("마이크에 접근할 수 없습니다. 브라우저 설정을 확인해주세요."); 
        }
    };
    
    /**
     * 코멘트(첨삭) 삭제
     */
    function handleDeleteComment(annotationIdToDelete) {
        if (isReadonly || !confirm('이 코멘트와 연결된 대화내용이 모두 삭제됩니다. 삭제하시겠습니까?')) return;
        
        const result = findAnnotationById(annotationIdToDelete);
        if (!result) return;
        
        const { page: pageNum } = result;

        // 1. Fabric 캔버스에서 객체 삭제
        const objectToRemove = fabricCanvas.getObjects().find(obj => obj.id === annotationIdToDelete);
        if(objectToRemove) { fabricCanvas.remove(objectToRemove); fabricCanvas.renderAll(); }
        
        // 2. annotations 데이터에서 삭제
        if (annotations[pageNum]) {
            annotations[pageNum] = annotations[pageNum].filter(a => a.id !== annotationIdToDelete);
        }
        
        // 3. 다른 코멘트에 연결된 링크 정보 제거
        Object.values(annotations).forEach(pageAnnos => {
            pageAnnos.forEach(anno => {
                if (anno.linkedComments && anno.linkedComments.includes(annotationIdToDelete)) {
                    anno.linkedComments = anno.linkedComments.filter(id => id !== annotationIdToDelete);
                }
            });
        });

        redrawMarkersForPage(parseInt(pageNum, 10)); 
        renderAllComments(); // 댓글 목록 UI 갱신
    }

    /**
     * 코멘트 연결 시작/취소
     */
    const handleLinkComment = (sourceId) => {
        const button = modalContentEl.querySelector(`.link-comment-btn[data-annotation-id="${sourceId}"]`);
        const commentListEl = modalContentEl.querySelector('#inline-feedback');
        if(!button || !commentListEl) return;
        
        if (linkingState.active && linkingState.sourceId === sourceId) { // 연결 취소
            linkingState.active = false;
            linkingState.sourceId = null;
            commentListEl.classList.remove('linking-active');
            modalContentEl.querySelectorAll('.comment-card.is-linking-source').forEach(c => c.classList.remove('is-linking-source'));
            button.textContent = '연결';
            button.classList.replace('bg-yellow-400', 'bg-gray-200');
        } else { // 연결 시작
            // 다른 활성 버튼 비활성화
            if(linkingState.active) {
                const otherActiveBtn = commentListEl.querySelector('.link-comment-btn.bg-yellow-400');
                if(otherActiveBtn) {
                    otherActiveBtn.textContent = '연결';
                    otherActiveBtn.classList.replace('bg-yellow-400', 'bg-gray-200');
                }
                modalContentEl.querySelectorAll('.comment-card.is-linking-source').forEach(c => c.classList.remove('is-linking-source'));
            }
            linkingState.active = true;
            linkingState.sourceId = sourceId;
            commentListEl.classList.add('linking-active');
            button.closest('.comment-card').classList.add('is-linking-source');
            button.textContent = '취소';
            button.classList.replace('bg-gray-200', 'bg-yellow-400');
        }
    };
    
    /**
     * 연결 모드에서 대상 카드 클릭 시
     */
    const handleCardClickInLinkingMode = (targetId) => {
        const commentListEl = modalContentEl.querySelector('#inline-feedback');
        if (!linkingState.active || linkingState.sourceId === targetId || !commentListEl) return;
        
        const sourceResult = findAnnotationById(linkingState.sourceId);
        const targetResult = findAnnotationById(targetId);

        if (sourceResult && targetResult) {
            const sourceAnno = sourceResult.annotation;
            const targetAnno = targetResult.annotation;
            
            // 양방향 연결
            if (!sourceAnno.linkedComments) sourceAnno.linkedComments = [];
            if (!targetAnno.linkedComments) targetAnno.linkedComments = [];
            
            if (!sourceAnno.linkedComments.includes(targetId)) {
                sourceAnno.linkedComments.push(targetId);
            }
            if (!targetAnno.linkedComments.includes(linkingState.sourceId)) {
                targetAnno.linkedComments.push(linkingState.sourceId);
            }
        }
        
        // 연결 상태 해제
        linkingState.active = false;
        linkingState.sourceId = null;
        commentListEl.classList.remove('linking-active');
        renderAllComments(); // UI 갱신
    };
    
    /**
     * 우측 패널의 모든 댓글 + 페이지 마커 렌더링
     */
    function renderAllComments() {
        const commentListEl = modalContentEl.querySelector('#inline-feedback');
        if (!commentListEl) return;
        
        commentListEl.innerHTML = '';
        const commentIdToNumberMap = {}; // { "anno-id": { number: 1, page: "1" } }
        const commentPages = new Set(); // 코멘트가 있는 페이지 번호
        const drawingHighlightPages = new Set(); // 판서/하이라이트가 있는 페이지 번호
        const renderableItems = []; // 렌더링할 아이템 목록

        let globalCommentCounter = 1;
        const sortedPageKeys = Object.keys(annotations).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
        
        // 1. 모든 첨삭을 순회하며 정보 수집
        sortedPageKeys.forEach(pageNum => {
            if (annotations[pageNum]) {
                annotations[pageNum].forEach(anno => {
                    if (anno.customType === 'comment') {
                        commentIdToNumberMap[anno.id] = { number: globalCommentCounter++, page: pageNum };
                        commentPages.add(pageNum);
                        renderableItems.push({ type: 'comment', pageNum: parseInt(pageNum), data: anno });
                    } else if (anno.customType === 'drawing' || anno.customType === 'highlight') {
                        drawingHighlightPages.add(pageNum);
                    }
                });
            }
        });

        // 2. 판서/하이라이트만 있고 코멘트는 없는 페이지를 찾아 '페이지 마커' 아이템 추가
        drawingHighlightPages.forEach(pageNum => {
            if (!commentPages.has(pageNum)) {
                renderableItems.push({ type: 'marker', pageNum: parseInt(pageNum) });
            }
        });

        // 3. 렌더링할 아이템들을 페이지 번호순으로 정렬 (중복 제거 로직 포함)
        const finalItems = Object.values(renderableItems.reduce((acc, item) => {
            const key = item.type === 'comment' ? item.data.id : `marker-${item.pageNum}`;
            if (!acc[key]) acc[key] = item;
            return acc;
        }, {})).sort((a, b) => a.pageNum - b.pageNum);

        // 4. 최종 아이템 렌더링
        finalItems.forEach(item => {
            if (item.type === 'comment') {
                const commentInfo = commentIdToNumberMap[item.data.id];
                addCommentCard(item.data, commentIdToNumberMap, commentInfo.number, item.pageNum);
            } else if (item.type === 'marker') {
                const markerHTML = `
                    <div class="page-marker-card bg-blue-50 border-l-4 border-blue-400 p-3 my-2 flex justify-between items-center hover:bg-blue-100" data-page-num="${item.pageNum}">
                        <p class="text-sm font-semibold text-blue-800"><i class="fas fa-paint-brush mr-2"></i> ${item.pageNum}페이지에 판서/하이라이트가 있습니다.</p>
                        <span class="text-xs text-blue-600 font-bold">이동하기 &rarr;</span>
                    </div>`;
                commentListEl.innerHTML += markerHTML;
            }
        });
        
        if (commentListEl.innerHTML === '') {
            commentListEl.innerHTML = `<p class="text-xs text-center text-gray-500">등록된 첨삭이 없습니다.<br>${isReadonly ? '' : '도구를 사용해 새 첨삭을 추가하세요.'}</p>`;
        }
    }

    /**
     * 개별 댓글 카드 UI 생성 및 추가
     */
    function addCommentCard(annotationData, commentIdToNumberMap, commentNumber, pageNum) {
        const commentListEl = modalContentEl.querySelector('#inline-feedback');
        if (!commentListEl) return;
        
        const newCard = document.createElement('div');
        newCard.className = 'bg-white p-3 border rounded-md shadow-sm comment-card';
        newCard.dataset.annotationId = annotationData.id;
        newCard.dataset.pageNum = pageNum;
        
        // 연결된 코멘트 태그 생성
        let linkedCommentsHtml = '';
        if (annotationData.linkedComments && annotationData.linkedComments.length > 0) {
            const links = annotationData.linkedComments.map(linkedId => {
                const info = commentIdToNumberMap[linkedId];
                return info ? `<span class="linked-comment-tag inline-block bg-gray-200 text-gray-700 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full" data-target-id="${linkedId}" title="${info.page}페이지의 코멘트 #${info.number}">#${info.number}</span>` : '';
            }).join('');
            linkedCommentsHtml = `<div class="mt-2 text-xs text-gray-800">🔗 <strong>연결된 코멘트:</strong> ${links}</div>`;
        }
        
        // 댓글 스레드 HTML 생성
        const threadHTML = renderCommentThread(annotationData.comments, feedback.studentName);
        
        newCard.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <p class="text-xs font-bold text-gray-600">#${commentNumber}. (p.${pageNum})</p>
                <div class="flex items-center space-x-2 ${isReadonly ? 'hidden' : ''}">
                    <button class="link-comment-btn text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-300" data-annotation-id="${annotationData.id}">연결</button>
                    <button class="delete-comment-btn text-gray-400 hover:text-red-500" title="코멘트 삭제" data-annotation-id="${annotationData.id}"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
            </div>
            ${threadHTML ? `<div class="comment-thread border rounded-md p-2 mb-2 bg-gray-50">${threadHTML}</div>` : ''}
            <div class="reply-area ${isReadonly ? 'hidden' : ''}">
                <textarea id="comment-reply-${annotationData.id}" class="w-full p-1.5 border rounded-md text-sm" rows="3" placeholder="댓글을 입력하세요..."></textarea>
                <div id="attachments-list-${annotationData.id}" class="text-sm mt-2 space-y-1"></div>
                <div class="flex justify-between items-center mt-2">
                    <div>
                        <button class="attach-btn text-gray-500 hover:text-gray-800 mr-2" data-input-id="file-input-${annotationData.id}" title="파일 첨부"><i class="fas fa-paperclip"></i></button>
                        <input type="file" id="file-input-${annotationData.id}" class="hidden" multiple>
                        <button class="record-btn text-gray-500 hover:text-gray-800" data-annotation-id="${annotationData.id}" title="음성 녹음">
                            <i class="fas fa-microphone"></i><i class="fas fa-stop" style="display:none;"></i>
                            <span class="ml-1 font-mono text-xs record-timer" id="record-timer-${annotationData.id}">00:00</span>
                        </button>
                    </div>
                    <button class="quickmark-btn text-xs bg-gray-200 px-2 py-1 rounded-full" data-target="comment-reply-${annotationData.id}">자주쓰는 코멘트</button>
                </div>
            </div>
            <div class="linked-comments-container">${linkedCommentsHtml}</div>`;
        
        commentListEl.appendChild(newCard);
        
        // 읽기 전용이 아닐 때만 첨부파일 핸들러 설정
        if(!isReadonly) {
            setupAttachmentHandlers(
                annotationData.id,
                newCard.querySelector('.attach-btn'),
                newCard.querySelector(`#file-input-${annotationData.id}`),
                newCard.querySelector(`#attachments-list-${annotationData.id}`)
            );
        }
    };

    /**
     * 피드백 모달 내의 모든 클릭 이벤트 위임 처리
     */
    modalContentEl.addEventListener('click', (e) => {
        // 1. 퀵마크 버튼 클릭
        const quickmarkBtn = e.target.closest('.quickmark-btn');
        if (quickmarkBtn) {
            showQuickMarkPopover(quickmarkBtn); // common.js 함수 호출
            return; 
        }

        // 2. 총평/본문첨삭 탭 클릭
        const tab = e.target.closest('.feedback-tab');
        if (tab) {
            modalContentEl.querySelectorAll('.feedback-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            modalContentEl.querySelectorAll('.feedback-content').forEach(c => c.classList.add('hidden'));
            modalContentEl.querySelector(`#${tab.dataset.tab}-feedback`).classList.remove('hidden');
            return;
        }
        
        // 3. 페이지 마커(# 없는 카드) 클릭
        const markerCard = e.target.closest('.page-marker-card');
        if (markerCard) {
            modalContentEl.querySelectorAll('.comment-card.highlight, .page-marker-card.highlight').forEach(el => el.classList.remove('highlight'));
            markerCard.classList.add('highlight');
            queueRenderPage(parseInt(markerCard.dataset.pageNum, 10)); // 해당 페이지로 이동
            return;
        }

        // 4. 댓글 카드(# 있는 카드) 클릭
        const commentCard = e.target.closest('.comment-card');
        if (commentCard) {
            // 4a. 연결된 코멘트 태그(#번호) 클릭
            if (e.target.closest('.linked-comment-tag')) {
                const linkTag = e.target.closest('.linked-comment-tag');
                const targetId = linkTag.dataset.targetId;
                const targetCard = modalContentEl.querySelector(`.comment-card[data-annotation-id="${targetId}"]`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCard.classList.add('highlight'); // 하이라이트
                    setTimeout(() => targetCard.classList.remove('highlight'), 2000);
                }
            } 
            // 4b. '연결' 버튼 클릭
            else if (e.target.closest('.link-comment-btn')) {
                handleLinkComment(commentCard.dataset.annotationId);
            } 
            // 4c. '삭제' 버튼 클릭
            else if (e.target.closest('.delete-comment-btn')) {
                handleDeleteComment(commentCard.dataset.annotationId);
            } 
            // 4d. '녹음' 버튼 클릭
            else if (e.target.closest('.record-btn')) {
                 handleVoiceRecording(e.target.closest('.record-btn'));
            } 
            // 4e. '연결' 모드에서 카드 클릭
            else if (linkingState.active) {
                handleCardClickInLinkingMode(commentCard.dataset.annotationId);
            } 
            // 4f. 카드 본문 클릭 (페이지 이동)
            else if (!e.target.closest('textarea, a, audio, button, input')) {
                modalContentEl.querySelectorAll('.comment-card.highlight, .page-marker-card.highlight').forEach(el => el.classList.remove('highlight'));
                commentCard.classList.add('highlight');
                queueRenderPage(parseInt(commentCard.dataset.pageNum, 10)); // 해당 페이지로 이동
            }
            return;
        }

        // 5. '피드백 제출' 버튼 클릭
        const submitBtn = e.target.closest('#submit-feedback-btn');
        if (submitBtn && !isReadonly) {
             const now = new Date();
             const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
             
             // 5a. 총평 댓글 처리
             const generalReplyText = modalContentEl.querySelector('#general-feedback-reply').value.trim();
             const generalAttachments = (attachmentHandlers['general']?.files || []).map(f => ({ fileName: f.name, fileUrl: '#' /* 실제로는 업로드 후 URL */ }));
             const savedFeedbackData = professorData.feedbackAnnotations[feedbackId] || { generalFeedbackThread: [], annotations: {} };

             if (generalReplyText || generalAttachments.length > 0) {
                 savedFeedbackData.generalFeedbackThread.push({
                     id: `gf-${Date.now()}`, author: '박교수', text: generalReplyText || '(파일 첨부)',
                     timestamp: timestamp, attachments: generalAttachments
                 });
             }
             
             // 5b. 본문 첨삭 댓글 처리
             Object.keys(annotations).forEach(pageNum => {
                 if(annotations[pageNum]) {
                     annotations[pageNum].filter(a => a.customType === 'comment').forEach(anno => {
                         const replyTextEl = modalContentEl.querySelector(`#comment-reply-${anno.id}`);
                         if(replyTextEl) {
                             const replyText = replyTextEl.value.trim();
                             const attachments = (attachmentHandlers[anno.id]?.files || []).map(f => ({ fileName: f.name, fileUrl: '#' }));
                             
                             if(replyText || attachments.length > 0) {
                                 if(!anno.comments) anno.comments = [];
                                 anno.comments.push({
                                     id: `cm-${Date.now()}`, author: '박교수', text: replyText || '(파일 첨부)',
                                     timestamp: timestamp, attachments: attachments
                                 });
                             }
                         }
                     });
                 }
             });
             
             // 5c. 데이터 저장 및 상태 변경
             savedFeedbackData.annotations = annotations;
             professorData.feedbackAnnotations[feedbackId] = savedFeedbackData;
             const feedbackItem = professorData.feedbackRequests.find(f => f.id === feedbackId);
             if (feedbackItem) feedbackItem.status = '피드백 완료';
             
             submitBtn.innerHTML = `저장 완료!`; 
             submitBtn.classList.replace('bg-[#6A0028]', 'bg-green-600'); 
             submitBtn.disabled = true;
             
             // 1.5초 후 모달 닫고 목록 갱신
             setTimeout(() => { 
                 closeModal('feedback-modal'); // common.js
                 // main.js의 renderView 함수 호출
                 if (window.renderView) window.renderView('onlineFeedback');
             }, 1500);
        }
    });

    // [키보드 이벤트] 첨삭 객체 삭제 (Delete, Backspace)
    if (!isReadonly) {
       activeKeyDownHandler = (e) => {
            // (textarea 등 텍스트 입력 중에는 작동 방지)
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
           
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const activeObject = fabricCanvas.getActiveObject();
                if (activeObject) {
                    e.preventDefault();
                    if (activeObject.customType === 'comment' || activeObject.isCommentRect) {
                        handleDeleteComment(activeObject.id);
                    } else if (activeObject.customType === 'drawing' || activeObject.customType === 'highlight') {
                        if (confirm('선택된 판서/하이라이트를 삭제하시겠습니까?')) {
                            fabricCanvas.remove(activeObject);
                            for (const pageNumKey in annotations) {
                               if(annotations[pageNumKey]) {
                                   const initialLength = annotations[pageNumKey].length;
                                   annotations[pageNumKey] = annotations[pageNumKey].filter(anno => anno.id !== activeObject.id);
                                   if (annotations[pageNumKey].length < initialLength) break;
                               }
                            }
                            fabricCanvas.renderAll();
                            renderAllComments();
                        }
                    }
                }
            }
        };
        window.addEventListener('keydown', activeKeyDownHandler);
    }

    // 첨삭 데이터 변경 시(addAnnotation, eraseObjectAtPointer) 발생하는 커스텀 이벤트 리스너
    modalContentEl.addEventListener('annotationsChanged', renderAllComments);

    // 초기 댓글 목록 렌더링
    renderAllComments();
}


/**
 * [피드백] 피드백 상세 모달 메인 함수 (from ver.1.25)
 * @param {string} feedbackId - 'fb-010'과 같은 피드백 요청 ID
 * @param {string} mode - 'edit' 또는 'readonly'
 */
async function showFeedbackDetails(feedbackId, mode = 'edit') {
    const feedback = professorData.feedbackRequests.find(f => f.id === feedbackId);
    if (!feedback) return;

    openModal('feedback-modal', () => { // common.js
        const contentEl = document.getElementById('feedback-modal-content');
        const headerEl = document.getElementById('feedback-modal-header');
        const isReadonly = mode === 'readonly';

        // 1. 모달 헤더 구성
        headerEl.innerHTML = `
            <h3 class="text-xl font-bold text-gray-800">[v${feedback.version}] ${feedback.file}</h3>
            <span class="text-sm font-semibold px-3 py-1 rounded-full ${isReadonly ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'}">
                ${isReadonly ? '읽기 전용' : '피드백 진행'}
            </span>
            <button id="version-nav-btn" class="bg-gray-200 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-300 text-xs font-semibold">다른 버전 보기</button>
        `;
        
        // 2. 모달 콘텐츠 영역 (PDF 뷰어 + 피드백 패널) 구성
        contentEl.innerHTML = `
            <div class="w-2/3 bg-gray-200 p-2 flex flex-col overflow-hidden pdf-viewer-panel">
                 <div class="bg-gray-50 p-2 rounded-t-md flex items-center justify-between sticky top-0 z-50 flex-shrink-0">
                    <div class="flex items-center space-x-2">
                        <button id="prev-page" title="이전 페이지" class="pdf-toolbar-btn p-1.5 hover:bg-gray-200 rounded-full disabled:text-gray-300 disabled:cursor-not-allowed"><svg class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></button>
                        <span class="text-xs">Page <span id="page-num">0</span> / <span id="page-count">0</span></span>
                        <button id="next-page" title="다음 페이지" class="pdf-toolbar-btn p-1.5 hover:bg-gray-200 rounded-full disabled:text-gray-300 disabled:cursor-not-allowed"><svg class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg></button>
                        <div class="w-px h-5 bg-gray-300 mx-2"></div>
                        <button id="zoom-out-btn" title="축소" class="pdf-toolbar-btn p-1.5 hover:bg-gray-200 rounded-full"><svg class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd" /></svg></button>
                        <span id="zoom-level" class="text-xs font-semibold w-12 text-center">100%</span>
                        <button id="zoom-in-btn" title="확대" class="pdf-toolbar-btn p-1.5 hover:bg-gray-200 rounded-full"><svg class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" /></svg></button>
                        <div class="w-px h-5 bg-gray-300 mx-2"></div>
                        <button id="fit-page-btn" title="페이지 맞춤" class="pdf-toolbar-btn p-1.5 hover:bg-gray-200 rounded-md"><svg class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H4zm0-2c-1.657 0-3 1.343-3 3v12c0 1.657 1.343 3 3 3h12c1.657 0 3-1.343 3-3V4c0 -1.657-1.343-3-3-3H4z"/><path d="M10 9a1 1 0 011-1h3a1 1 0 110 2h-3a1 1 0 01-1-1zM6 9a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1z"/></svg></button>
                    </div>
                    <div class="flex items-center space-x-1 border border-gray-300 rounded-lg p-0.5 ${isReadonly ? 'hidden' : ''}">
                         <button id="select-tool" title="선택 및 텍스트 드래그" class="pdf-toolbar-btn p-1.5 hover:bg-gray-200 rounded-md"><svg class="h-5 w-5 pointer-events-none" viewBox="0 0 16 16" fill="currentColor"><path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"/></svg></button>
                         <button id="comment-tool" title="첨삭 영역 추가" class="pdf-toolbar-btn p-1.5 hover:bg-gray-200 rounded-md"><svg class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM9 9a1 1 0 100-2 1 1 0 000 2zm2 0a1 1 0 100-2 1 1 0 000 2zm2 0a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg></button>
                         <button id="highlight-tool" title="하이라이트" class="pdf-toolbar-btn p-1.5 hover:bg-gray-200 rounded-md"><svg class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
                         <button id="drawing-tool" title="판서" class="pdf-toolbar-btn p-1.5 hover:bg-gray-200 rounded-md"><svg class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg></button>
                         <button id="eraser-tool" title="지우개" class="pdf-toolbar-btn p-1.5 hover:bg-gray-200 rounded-md"><svg class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 002.828 0L21 9.656a2 2 0 000-2.828L15.172 1a2 2 0 00-2.828 0L3 12z" /></svg></button>
                    </div>
                 </div>
                 <div id="pdf-render-wrapper">
                    <div id="pdf-render-area" class="shadow-lg">
                        <canvas id="pdf-canvas"></canvas>
                        <div class="absolute top-0 left-0"><canvas id="interaction-canvas"></canvas></div>
                        <div id="text-layer"></div>
                        <div id="marker-container"></div>
                    </div>
                 </div>
            </div>
            <div class="w-1/3 p-4 flex flex-col overflow-y-auto feedback-panel">
                <div class="flex-grow">
                    <div class="border-b pb-3">
                        <h4 class="text-md font-bold text-gray-800 mb-2">연구 윤리 검사 결과</h4>
                        <div class="text-sm space-y-2">
                            <div class="flex justify-between items-center"><span><strong>CopyKiller:</strong> <span class="font-bold ${parseInt(feedback.copykillerScore) > 15 ? 'text-red-600' : 'text-green-600'}">${feedback.copykillerScore}</span></span><a href="#" class="text-xs text-[#6A0028] hover:underline">리포트 보기 &rarr;</a></div>
                            <div class="flex justify-between items-center"><span><strong>GPT Killer:</strong> <span class="font-bold ${parseInt(feedback.gptkillerScore) > 10 ? 'text-red-600' : 'text-green-600'}">${feedback.gptkillerScore}</span></span><a href="#" class="text-xs text-[#6A0028] hover:underline">리포트 보기 &rarr;</a></div>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="flex border-b"><button data-tab="general" class="feedback-tab flex-1 py-2 text-sm font-semibold text-gray-600 border-b-2 border-transparent hover:bg-gray-100 active">총평</button><button data-tab="inline" class="feedback-tab flex-1 py-2 text-sm font-semibold text-gray-600 border-b-2 border-transparent hover:bg-gray-100">본문 첨삭</button></div>
                        <div id="feedback-tab-content" class="mt-3">
                            <div id="general-feedback" class="feedback-content"></div>
                            <div id="inline-feedback" class="feedback-content hidden space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto pr-2"></div>
                        </div>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t flex justify-end items-center">
                    <button class="modal-close-btn bg-gray-200 text-gray-800 px-4 py-2 rounded-md mr-2 hover:bg-gray-300 text-sm">${isReadonly ? '닫기' : '취소'}</button>
                    <button id="submit-feedback-btn" class="bg-[#6A0028] text-white px-4 py-2 rounded-md hover:bg-opacity-90 text-sm transition-colors duration-300 ${isReadonly ? 'hidden' : ''}">피드백 제출</button>
                </div>
            </div>
        `;
        
        // 4. '다른 버전 보기' 버튼에 이벤트 할당
        document.getElementById('version-nav-btn').onclick = () => showVersionSelector(feedback.documentId);
        
        // 5. 저장된 피드백 데이터 로드
        const savedFeedbackData = professorData.feedbackAnnotations[feedbackId] || { generalFeedbackThread: [], annotations: {} };
        
        // 6. 총평 탭 렌더링
        const generalFeedbackEl = document.getElementById('general-feedback');
        const generalThreadHTML = renderCommentThread(savedFeedbackData.generalFeedbackThread, feedback.studentName);
        
        generalFeedbackEl.innerHTML = `
            ${generalThreadHTML ? `<div class="comment-thread border rounded-md p-3 mb-3 bg-white">${generalThreadHTML}</div>` : ''}
            <div class="reply-area ${isReadonly ? 'hidden' : ''}">
                <textarea id="general-feedback-reply" class="w-full p-2 border rounded-md text-sm" rows="4" placeholder="총평에 대한 답변을 입력하세요..."></textarea>
                <div id="general-attachments-list" class="text-sm mt-2 space-y-1"></div>
                <div class="flex justify-between items-center mt-2">
                    <button id="general-attach-btn" class="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300"><i class="fas fa-paperclip mr-1"></i> 파일 첨부</button>
                    <input type="file" id="general-file-input" class="hidden" multiple>
                    <button class="quickmark-btn text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-300" data-target="general-feedback-reply">자주쓰는 코멘트</button>
                </div>
            </div>
        `;

        // 7. 총평 첨부파일 핸들러 설정 (읽기 전용 아닐 때)
        if(!isReadonly) {
            setupAttachmentHandlers(
                'general',
                contentEl.querySelector('#general-attach-btn'),
                contentEl.querySelector('#general-file-input'),
                contentEl.querySelector('#general-attachments-list')
            );
        }
        
        // 8. PDF 뷰어 초기화
        const pdfViewerContext = initializePdfViewer(contentEl, savedFeedbackData.annotations, mode);
        
        // 9. 피드백 모달의 모든 이벤트 리스너 설정
        setupModalEventListeners(contentEl, { ...pdfViewerContext, feedbackId, isReadonly, feedback });
    });
}