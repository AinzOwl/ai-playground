document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const modelSelectorDropdown = document.getElementById('model-selector-dropdown');
    
    // API & Model Management (within the main management modal)
    const apiFormTitle = document.getElementById('api-form-title');
    const apiEditIdInput = document.getElementById('api-edit-id');
    const apiNameInput = document.getElementById('api-name');
    const apiBaseUrlInput = document.getElementById('api-base-url');
    const apiKeyInput = document.getElementById('api-key');
    const fetchModelsBtn = document.getElementById('fetch-models-btn');
    const apiModelsContainer = document.getElementById('api-models-container');
    const modelSearchInput = document.getElementById('model-search-input');
    const apiModelsList = document.getElementById('api-models-list');
    const modelConfigListContainer = document.getElementById('model-config-list-container');

    // Conversation
    const messagesContainer = document.getElementById('messages-container');
    const addMessageBtn = document.getElementById('add-message-btn');
    const systemPromptTextarea = document.getElementById('system-prompt');
    const toggleSystemPromptBtn = document.getElementById('toggle-system-prompt-btn');

    // Response
    const responseContentContainer = document.getElementById('response-content-container');
    const addResponseToConvoBtn = document.getElementById('add-response-to-convo-btn');
    
    const submitBtn = document.getElementById('submit-btn');
    const stopBtn = document.getElementById('stop-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyResponseBtn = document.getElementById('copy-response-btn');

    const latencyEl = document.getElementById('latency');
    const tokensPerSecondEl = document.getElementById('tokens-per-second');

    // Standard Parameters
    const temperatureSlider = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperature-value');
    const maxTokensInput = document.getElementById('max-tokens');
    const topPSlider = document.getElementById('top-p');
    const topPValue = document.getElementById('top-p-value');
    const streamToggle = document.getElementById('stream');
    
    // Parameter Management
    const manageParamsBtn = document.getElementById('manage-params-btn');
    const manageParamsModal = document.getElementById('manage-params-modal');
    const closeManageParamsModalBtn = document.getElementById('close-manage-params-modal-btn');
    const resetParamsBtn = document.getElementById('reset-params-btn');
    const paramListContainer = document.getElementById('param-list-container');
    const paramFormTitle = document.getElementById('param-form-title');
    const paramEditKeyInput = document.getElementById('param-edit-key');
    const saveParamBtn = document.getElementById('save-param-btn');
    const showAddParamFormBtn = document.getElementById('show-add-param-form-btn');
    const paramKeyInput = document.getElementById('param-key');
    const paramTypeSelect = document.getElementById('param-type');
    const paramNumberSliderFields = document.getElementById('param-number-slider-fields');
    const paramMinInput = document.getElementById('param-min');
    const paramMaxInput = document.getElementById('param-max');
    const paramStepInput = document.getElementById('param-step');
    const paramDefaultValueInput = document.getElementById('param-default-value');

    // Code Snippet Bar
    const showCodeBtn = document.getElementById('show-code-btn');
    const codeSnippetBar = document.getElementById('code-snippet-bar');
    const closeCodeBarBtn = document.getElementById('close-code-bar-btn');
    const languageSelector = document.getElementById('language-selector');
    const codeSnippetContent = document.getElementById('code-snippet-content');
    const copyCodeBtn = document.getElementById('copy-code-btn');
    const codeBarResizer = document.getElementById('code-bar-resizer');

    // Main Management Modal
    const workspaceManagerBtn = document.getElementById('workspace-manager-btn');
    const managementModal = document.getElementById('workspace-modal'); // Renamed for clarity
    const closeManagementModalBtn = document.getElementById('close-workspace-modal-btn');
    const managementTabBtns = document.querySelectorAll('.management-tab-btn');
    
    // Workspace Management
    const workspaceNameInput = document.getElementById('workspace-name');
    const saveWorkspaceBtn = document.getElementById('save-workspace-btn');
    const workspaceListContainer = document.getElementById('workspace-list-container');
    const downloadBackupBtn = document.getElementById('download-backup-btn');
    const importBackupBtn = document.getElementById('import-backup-btn');
    const importBackupInput = document.getElementById('import-backup-input');
    const includeApisToggle = document.getElementById('include-apis-toggle');


    // --- App State ---
    let abortController;
    
    const defaultParameters = [
        { key: 'temperature', type: 'number', defaultValue: 1, min: 0, max: 2, step: 0.01, isStandard: true },
        { key: 'top_p', type: 'number', defaultValue: 1, min: 0, max: 1, step: 0.01, isStandard: true },
        { key: 'max_tokens', type: 'number_input', defaultValue: 1024, isStandard: true },
        { key: 'stream', type: 'boolean', defaultValue: true, isStandard: true },
    ];

    let state = {
        apis: [], 
        activeModels: [], // { id, apiId, modelId, nickname, enabled }
        selectedModelId: null,
        isRequesting: false,
        messages: [],
        systemPromptVisible: true,
        rawResponse: '',
        paramDefinitions: [...defaultParameters],
        paramValues: {},
        workspaces: [],
        lastRequestBody: null,
    };

    // --- Functions ---

    const toggleModal = (modalElement, show) => {
        modalElement.classList.toggle('hidden', !show);
        modalElement.classList.toggle('flex', show);
    };

    const loadSettings = () => {
        const savedSettings = localStorage.getItem('aiPlaygroundSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            state = { ...state, ...settings };
            state.apis = settings.apis || [];
            state.activeModels = settings.activeModels || [];
            state.paramDefinitions = settings.paramDefinitions || [...defaultParameters];
            state.paramValues = settings.paramValues || {};
            state.workspaces = settings.workspaces || [];
        }
        
        initializeParamValues();
        updateStandardParamUI();
        renderCustomParams();
        renderMessages();
        renderModelSelectorDropdown();
    };

    const saveSettings = () => {
        localStorage.setItem('aiPlaygroundSettings', JSON.stringify(state));
    };

    const initializeParamValues = () => {
        state.paramDefinitions.forEach(p => {
            if (state.paramValues[p.key] === undefined) {
                state.paramValues[p.key] = p.defaultValue;
            }
        });
    };
    
    const updateStandardParamUI = () => {
        temperatureSlider.value = state.paramValues.temperature;
        temperatureValue.textContent = state.paramValues.temperature;
        topPSlider.value = state.paramValues.top_p;
        topPValue.textContent = state.paramValues.top_p;
        maxTokensInput.value = state.paramValues.max_tokens;
        streamToggle.checked = state.paramValues.stream;
    };
    
    const renderModelSelectorDropdown = () => {
        modelSelectorDropdown.innerHTML = '';
        const enabledModels = state.activeModels.filter(m => m.enabled);
        
        if (enabledModels.length === 0) {
            modelSelectorDropdown.innerHTML = '<option value="">No models enabled</option>';
            return;
        }

        enabledModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.nickname || model.modelId;
            if(model.id === state.selectedModelId) {
                option.selected = true;
            }
            modelSelectorDropdown.appendChild(option);
        });
        
        // Ensure selectedModelId is valid
        if (!enabledModels.some(m => m.id === state.selectedModelId)) {
            state.selectedModelId = enabledModels.length > 0 ? enabledModels[0].id : null;
        }
    };
    
    // --- API & Model Management ---
    
    const switchManagementTab = (tabId) => {
        managementTabBtns.forEach(btn => {
            const isSelected = btn.dataset.tab === tabId;
            btn.classList.toggle('bg-gray-700', isSelected);
            btn.classList.toggle('text-white', isSelected);
        });
        document.querySelectorAll('.management-tab-content').forEach(content => {
            content.classList.toggle('hidden', content.dataset.tabContent !== tabId);
        });
    };
    
    const resetApiForm = () => {
        apiFormTitle.textContent = 'Add API';
        apiEditIdInput.value = '';
        apiNameInput.value = '';
        apiBaseUrlInput.value = '';
        apiKeyInput.value = '';
        apiModelsContainer.classList.add('hidden');
    };
    
    const renderApiList = () => {
        const container = managementModal.querySelector('#api-list-container');
        container.innerHTML = '';
        const header = document.createElement('h4');
        header.className = 'font-semibold mb-2 text-white';
        header.textContent = 'Saved APIs';
        container.appendChild(header);

        if (state.apis.length === 0) {
            container.innerHTML += '<p class="text-sm text-gray-400">No APIs saved yet.</p>';
        }

        state.apis.forEach(api => {
            const item = document.createElement('div');
            item.className = 'p-2 rounded-md hover:bg-gray-700 flex justify-between items-center';
            item.innerHTML = `
                <div>
                    <p class="font-medium">${api.name}</p>
                    <p class="text-xs text-gray-500">${api.baseUrl}</p>
                </div>
                <div>
                    <button class="edit-api-btn text-xs text-blue-400" data-id="${api.id}">Edit</button>
                    <button class="delete-api-btn text-xs text-red-400" data-id="${api.id}">&times;</button>
                </div>
            `;
            container.appendChild(item);
        });
    };
    
    const saveApi = () => {
        const id = apiEditIdInput.value;
        const name = apiNameInput.value.trim();
        const baseUrl = apiBaseUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();

        if (!name || !baseUrl || !apiKey) {
            alert('Name, Base URL, and API Key are required.');
            return null;
        }
        
        let apiId = id;
        if (id) {
            const index = state.apis.findIndex(a => a.id === id);
            state.apis[index] = { ...state.apis[index], name, baseUrl, apiKey };
        } else {
            apiId = Date.now().toString();
            state.apis.push({ id: apiId, name, baseUrl, apiKey });
            apiEditIdInput.value = apiId;
        }
        renderApiList();
        return apiId;
    };
    
    const fetchModelsForApi = async () => {
        const baseUrl = apiBaseUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        if (!baseUrl || !apiKey) {
            alert('Base URL and API Key are required to fetch models.');
            return;
        }

        fetchModelsBtn.disabled = true;
        fetchModelsBtn.textContent = 'Fetching...';
        apiModelsList.innerHTML = '<p class="text-sm text-gray-400">Loading...</p>';
        apiModelsContainer.classList.remove('hidden');

        try {
            const apiId = saveApi();
            if (!apiId) return;

            const response = await fetch(`${baseUrl}/models`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            const fetchedModels = data.data.map(m => m.id).sort();
            
            // Auto-activate new models
            fetchedModels.forEach(modelId => {
                const uniqueId = `${apiId}-${modelId}`;
                if (!state.activeModels.some(m => m.id === uniqueId)) {
                    state.activeModels.push({ id: uniqueId, apiId, modelId, nickname: '', enabled: true });
                }
            });
            alert(`${fetchedModels.length} models found and activated. You can manage them in the 'Models' tab.`);
            renderFetchedModels(apiId, fetchedModels, true);

        } catch (e) {
            apiModelsList.innerHTML = '<p class="text-sm text-red-400">Error fetching models.</p>';
        } finally {
            fetchModelsBtn.disabled = false;
            fetchModelsBtn.textContent = 'Fetch & Activate Models';
        }
    };
    
    const renderFetchedModels = (apiId, models, allChecked = false) => {
        apiModelsList.innerHTML = '';
        models.forEach(modelId => {
            const uniqueId = `${apiId}-${modelId}`;
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between text-sm';
            item.innerHTML = `
                <label for="model-${uniqueId}" class="flex-grow cursor-pointer">${modelId}</label>
                <input type="checkbox" id="model-${uniqueId}" ${allChecked ? 'checked' : ''} disabled class="model-activate-checkbox">
            `;
            apiModelsList.appendChild(item);
        });
    };
    
    const renderModelConfigList = () => {
        modelConfigListContainer.innerHTML = '';
        if (state.activeModels.length === 0) {
             modelConfigListContainer.innerHTML = '<p class="text-sm text-gray-400">No active models. Add an API and activate some models first.</p>';
        }
        state.activeModels.forEach(model => {
             const item = document.createElement('div');
             item.className = 'p-3 bg-gray-700 rounded-md flex items-center space-x-3';
             item.dataset.id = model.id;
             item.innerHTML = `
                <span class="cursor-move text-gray-500">☰</span>
                <div class="flex-grow">
                    <p class="font-semibold">${model.modelId}</p>
                    <input type="text" value="${model.nickname || ''}" placeholder="Set a nickname..." data-id="${model.id}" class="model-nickname-input w-full bg-gray-800 border border-gray-600 rounded-md p-1 text-sm mt-1">
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" ${model.enabled ? 'checked' : ''} data-id="${model.id}" class="sr-only peer model-enable-toggle">
                    <div class="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
             `;
             modelConfigListContainer.appendChild(item);
        });
        
        // Init SortableJS
        new Sortable(modelConfigListContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: (evt) => {
                const { oldIndex, newIndex } = evt;
                const [movedItem] = state.activeModels.splice(oldIndex, 1);
                state.activeModels.splice(newIndex, 0, movedItem);
                renderModelSelectorDropdown();
            }
        });
    };

    const handleChatCompletion = async () => {
        if (!state.selectedModelId) {
            alert('Please select a model first.');
            return;
        }
        
        const activeModel = state.activeModels.find(m => m.id === state.selectedModelId);
        if (!activeModel) {
            alert('Selected model is not active or found. Please configure it in the API & Model Management screen.');
            return;
        }
        const api = state.apis.find(a => a.id === activeModel.apiId);
        if (!api) {
            alert('API for the selected model not found. Please configure it.');
            return;
        }

        if (state.isRequesting) {
            if (abortController) abortController.abort();
            return;
        };
        
        const validMessages = state.messages.filter(m => m.content.trim() !== '');
        if (validMessages.length === 0) {
            alert('Please add at least one message.');
            return;
        }

        state.isRequesting = true;
        submitBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        responseContentContainer.innerHTML = '';
        state.rawResponse = '';
        latencyEl.textContent = 'N/A';
        tokensPerSecondEl.textContent = 'N/A';
        const startTime = performance.now();

        const messages = [...validMessages];
        const systemPrompt = systemPromptTextarea.value.trim();
        if (systemPrompt && state.systemPromptVisible) {
            messages.unshift({ role: 'system', content: systemPrompt });
        }

        const body = {
            model: activeModel.modelId,
            messages: messages,
        };
        for(const key in state.paramValues) {
             const definition = state.paramDefinitions.find(p => p.key === key);
             if (definition) body[key] = state.paramValues[key];
        }
        if (!body.max_tokens) delete body.max_tokens;
        
        state.lastRequestBody = { api, body };


        try {
            abortController = new AbortController();
            const response = await fetch(`${api.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${api.apiKey}`
                },
                body: JSON.stringify(body),
                signal: abortController.signal,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `HTTP error! status: ${response.status}`);
            }

            if (state.paramValues.stream) {
                await handleStreamedResponse(response, startTime);
            } else {
                await handleStandardResponse(response, startTime);
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                 console.log('Request aborted by user.');
                 responseContentContainer.textContent += '\n\n--- Generation stopped by user. ---';
            } else {
                 responseContentContainer.textContent = `Error: ${error.message}`;
            }
        } finally {
            state.isRequesting = false;
            submitBtn.classList.remove('hidden');
            stopBtn.classList.add('hidden');
        }
    };

    const handleStandardResponse = async (response, startTime) => {
        const data = await response.json();
        const endTime = performance.now();
        state.rawResponse = data.choices[0]?.message?.content || '';
        renderResponseContent();
        const duration = (endTime - startTime) / 1000;
        latencyEl.textContent = `${(duration * 1000).toFixed(0)} ms`;
        const totalTokens = data.usage?.total_tokens || 0;
        if (totalTokens > 0 && duration > 0) {
            tokensPerSecondEl.textContent = (totalTokens / duration).toFixed(2);
        }
    };

    const handleStreamedResponse = async (response, startTime) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let chunkCount = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
                if (line.trim().startsWith('data:')) {
                    const jsonStr = line.trim().substring(5);
                    if (jsonStr === '[DONE]') continue;
                    try {
                        const chunk = JSON.parse(jsonStr);
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) {
                            state.rawResponse += content;
                            renderResponseContent();
                            responseContentContainer.parentElement.scrollTop = responseContentContainer.parentElement.scrollHeight;
                            chunkCount++;
                        }
                    } catch (e) { console.error('Failed to parse stream chunk:', jsonStr); }
                }
            }
        }
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        latencyEl.textContent = `${(duration * 1000).toFixed(0)} ms`;
        if (chunkCount > 0 && duration > 0) {
             tokensPerSecondEl.textContent = (chunkCount / duration).toFixed(2);
        }
    };

    const renderResponseContent = () => {
        responseContentContainer.innerHTML = '';
        const parts = state.rawResponse.split(/<\/?think>/g);
        let inThinkBlock = state.rawResponse.startsWith('<think>');
        parts.forEach((part) => {
            if (part.trim() === '') return;
            if (inThinkBlock) {
                const thinkBlock = document.createElement('details');
                thinkBlock.className = 'bg-gray-700 border border-gray-600 rounded-lg my-2';
                thinkBlock.open = !state.rawResponse.includes('</think>');
                const summary = document.createElement('summary');
                summary.className = 'p-2 cursor-pointer text-sm font-semibold text-gray-300';
                summary.textContent = 'Thought Process';
                const content = document.createElement('div');
                content.className = 'p-3 border-t border-gray-600';
                content.textContent = part;
                thinkBlock.appendChild(summary);
                thinkBlock.appendChild(content);
                responseContentContainer.appendChild(thinkBlock);
            } else {
                const textNode = document.createElement('span');
                textNode.textContent = part;
                responseContentContainer.appendChild(textNode);
            }
            inThinkBlock = !inThinkBlock;
        });
    };

    const renderCustomParams = () => {
        // This function is no longer used as custom params are managed by renderManageParamsList
        // and renderParamForm. Keeping it for now in case it's called elsewhere.
        // customParamsContainer.innerHTML = '';
        // const customParams = state.paramDefinitions.filter(p => !p.isStandard);

        // customParams.forEach(param => {
        //     const wrapper = document.createElement('div');
        //     const value = state.paramValues[param.key];
            
        //     const header = document.createElement('div');
        //     header.className = 'flex justify-between items-center text-sm mb-1';
            
        //     const label = document.createElement('label');
        //     label.textContent = param.key.replace(/_/g, ' ');
        //     label.className = 'capitalize';

        //     const valueSpan = document.createElement('span');
        //     valueSpan.id = `param-value-${param.key}`;
        //     valueSpan.textContent = value;
            
        //     header.appendChild(label);
        //     if (param.type !== 'boolean') header.appendChild(valueSpan);
        //     wrapper.appendChild(header);

        //     let input;
        //     switch(param.type) {
        //         case 'number':
        //             input = document.createElement('input');
        //             input.type = 'range';
        //             input.min = param.min;
        //             input.max = param.max;
        //             input.step = param.step;
        //             input.value = value;
        //             input.className = 'w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer';
        //             input.oninput = (e) => {
        //                 state.paramValues[param.key] = parseFloat(e.target.value);
        //                 valueSpan.textContent = e.target.value;
        //             };
        //             break;
        //         case 'string':
        //         case 'number_input':
        //             input = document.createElement('input');
        //             input.type = param.type === 'string' ? 'text' : 'number';
        //             input.value = value;
        //             input.className = 'w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm';
        //             input.onchange = (e) => {
        //                 const val = param.type === 'number_input' ? parseFloat(e.target.value) : e.target.value;
        //                 state.paramValues[param.key] = val;
        //                 valueSpan.textContent = e.target.value;
        //             };
        //             break;
        //         case 'boolean':
        //             wrapper.className = 'flex justify-between items-center text-sm';
        //             wrapper.innerHTML = ''; 
        //             wrapper.appendChild(label);
                    
        //             const toggleLabel = document.createElement('label');
        //             toggleLabel.className = 'relative inline-flex items-center cursor-pointer';
        //             input = document.createElement('input');
        //             input.type = 'checkbox';
        //             input.className = 'sr-only peer';
        //             input.checked = value;
        //             input.onchange = (e) => state.paramValues[param.key] = e.target.checked;
                    
        //             const toggleDiv = document.createElement('div');
        //             toggleDiv.className = "w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600";
                    
        //             toggleLabel.appendChild(input);
        //             toggleLabel.appendChild(toggleDiv);
        //             wrapper.appendChild(toggleLabel);
        //             break;
        //     }
            
        //     if (param.type !== 'boolean') wrapper.appendChild(input);
        //     customParamsContainer.appendChild(wrapper);
        // });
    };
    
    const resetParamForm = (isEdit = false) => {
        paramFormTitle.textContent = isEdit ? 'Edit Parameter' : 'Add New Parameter';
        paramKeyInput.disabled = isEdit;
        paramEditKeyInput.value = '';
        paramKeyInput.value = '';
        paramTypeSelect.value = 'number';
        paramMinInput.value = 0;
        paramMaxInput.value = 1;
        paramStepInput.value = 0.1;
        paramDefaultValueInput.value = '';
        paramNumberSliderFields.classList.remove('hidden');
    };
    
    const populateParamForm = (param) => {
        resetParamForm(true);
        paramEditKeyInput.value = param.key;
        paramKeyInput.value = param.key;
        paramTypeSelect.value = param.type;
        paramDefaultValueInput.value = param.defaultValue;
        
        if(param.type === 'number') {
            paramMinInput.value = param.min;
            paramMaxInput.value = param.max;
            paramStepInput.value = param.step;
            paramNumberSliderFields.classList.remove('hidden');
        } else {
            paramNumberSliderFields.classList.add('hidden');
        }
    };
    
    const renderManageParamsList = () => {
        paramListContainer.innerHTML = '';
        state.paramDefinitions.forEach(param => {
            const item = document.createElement('div');
            item.className = 'flex justify-between items-center p-2 rounded-md hover:bg-gray-700';
            
            const name = document.createElement('span');
            name.textContent = param.key;
            item.appendChild(name);
            
            const controls = document.createElement('div');
            controls.className = 'flex items-center space-x-2';
            
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.className = 'text-xs text-blue-400 hover:text-blue-300';
            editBtn.onclick = () => populateParamForm(param);
            controls.appendChild(editBtn);
            
            if (!param.isStandard) {
                 const deleteBtn = document.createElement('button');
                 deleteBtn.innerHTML = '&times;';
                 deleteBtn.className = 'text-xs text-red-400 hover:text-red-300 font-bold';
                 deleteBtn.onclick = () => {
                    state.paramDefinitions = state.paramDefinitions.filter(p => p.key !== param.key);
                    delete state.paramValues[param.key];
                    renderManageParamsList();
                    renderCustomParams();
                 };
                 controls.appendChild(deleteBtn);
            }
            
            item.appendChild(controls);
            paramListContainer.appendChild(item);
        });
    };
    
    const saveParameter = () => {
        const key = paramKeyInput.value.trim();
        const editKey = paramEditKeyInput.value;
        const type = paramTypeSelect.value;
        const defaultValue = paramDefaultValueInput.value;

        if (!key) {
            alert('Parameter key cannot be empty.');
            return;
        }

        if (!editKey && state.paramDefinitions.some(p => p.key === key)) {
            alert('Parameter key already exists.');
            return;
        }

        const newParam = { key, type };
        let parsedDefault;

        switch(type) {
            case 'number':
                newParam.min = parseFloat(paramMinInput.value);
                newParam.max = parseFloat(paramMaxInput.value);
                newParam.step = parseFloat(paramStepInput.value);
                parsedDefault = parseFloat(defaultValue);
                if (isNaN(parsedDefault)) parsedDefault = newParam.min;
                break;
            case 'string':
                parsedDefault = defaultValue;
                break;
            case 'number_input':
                parsedDefault = parseFloat(defaultValue);
                if (isNaN(parsedDefault)) parsedDefault = 0;
                break;
            case 'boolean':
                parsedDefault = defaultValue.toLowerCase() === 'true';
                break;
        }
        
        newParam.defaultValue = parsedDefault;

        if (editKey) {
            const index = state.paramDefinitions.findIndex(p => p.key === editKey);
            state.paramDefinitions[index] = { ...state.paramDefinitions[index], ...newParam };
        } else {
            state.paramDefinitions.push(newParam);
        }
        
        state.paramValues[key] = parsedDefault;
        
        renderManageParamsList();
        renderCustomParams();
        updateStandardParamUI();
        resetParamForm();
    };
    
    const createMessageElement = (message, index) => {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'flex flex-col space-y-2';

        const header = document.createElement('div');
        header.className = 'flex justify-between items-center';

        const roleButton = document.createElement('button');
        roleButton.className = `text-sm font-semibold px-2 py-1 rounded-md bg-gray-600 hover:bg-gray-500`;
        roleButton.textContent = message.role.toUpperCase();
        roleButton.addEventListener('click', () => {
            state.messages[index].role = message.role === 'user' ? 'assistant' : 'user';
            renderMessages();
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'text-red-400 hover:text-red-300 font-bold p-1';
        deleteButton.innerHTML = '&times;';
        deleteButton.addEventListener('click', () => {
            state.messages.splice(index, 1);
            renderMessages();
        });

        header.appendChild(roleButton);
        header.appendChild(deleteButton);
        
        const textarea = document.createElement('textarea');
        textarea.className = 'w-full h-24 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none';
        textarea.value = message.content;
        textarea.addEventListener('input', (e) => {
            state.messages[index].content = e.target.value;
        });

        messageWrapper.appendChild(header);
        messageWrapper.appendChild(textarea);

        return messageWrapper;
    };

    const renderMessages = () => {
        messagesContainer.innerHTML = '';
        state.messages.forEach((msg, index) => {
            messagesContainer.appendChild(createMessageElement(msg, index));
        });
        messagesContainer.querySelectorAll('textarea').forEach(textarea => {
             textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) handleChatCompletion();
            });
        });
    };

    const addMessage = (role = 'user', content = '') => {
        state.messages.push({ role, content });
        renderMessages();
    };

    const renderWorkspaceList = () => {
        workspaceListContainer.innerHTML = '';
        if (state.workspaces.length === 0) {
            workspaceListContainer.innerHTML = '<p class="text-gray-400 text-sm">No saved workspaces yet.</p>';
            return;
        }

        state.workspaces.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

        state.workspaces.forEach(workspace => {
            const item = document.createElement('div');
            item.className = 'flex justify-between items-center p-3 bg-gray-800 rounded-md border border-gray-600';

            const info = document.createElement('div');
            const name = document.createElement('p');
            name.textContent = workspace.name;
            name.className = 'font-semibold';
            
            const date = document.createElement('p');
            date.textContent = `Saved: ${new Date(workspace.savedAt).toLocaleString()}`;
            date.className = 'text-xs text-gray-400';

            info.appendChild(name);
            info.appendChild(date);
            
            const controls = document.createElement('div');
            controls.className = 'flex items-center space-x-2';
            
            const loadBtn = document.createElement('button');
            loadBtn.textContent = 'Load';
            loadBtn.className = 'text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1 rounded-md';
            loadBtn.onclick = () => {
                if (confirm(`Are you sure you want to load the "${workspace.name}" workspace? This will overwrite your current session.`)) {
                    loadWorkspace(workspace.id);
                }
            };
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'text-sm bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded-md';
            deleteBtn.onclick = () => {
                 if (confirm(`Are you sure you want to delete the "${workspace.name}" workspace? This cannot be undone.`)) {
                    deleteWorkspace(workspace.id);
                }
            };

            controls.appendChild(loadBtn);
            controls.appendChild(deleteBtn);

            item.appendChild(info);
            item.appendChild(controls);
            workspaceListContainer.appendChild(item);
        });
    };

    const switchWorkspaceManagerTab = (isWorkspaceTab) => {
        // This function is no longer needed as tabs are managed by SortableJS
        // workspaceTabBtn.classList.toggle('bg-gray-700', isWorkspaceTab);
        // workspaceTabBtn.classList.toggle('text-white', isWorkspaceTab);
        // workspaceTabContent.classList.toggle('hidden', !isWorkspaceTab);

        // backupTabBtn.classList.toggle('bg-gray-700', !isWorkspaceTab);
        // backupTabBtn.classList.toggle('text-white', !isWorkspaceTab);
        // backupTabContent.classList.toggle('hidden', isWorkspaceTab);
    };

    const deleteWorkspace = (id) => {
        state.workspaces = state.workspaces.filter(w => w.id !== id);
        saveSettings();
        renderWorkspaceList();
    };

    const loadWorkspace = (id) => {
        const workspace = state.workspaces.find(w => w.id === id);
        if (!workspace) return alert('Workspace not found!');

        const s = workspace.state;
        state.messages = s.messages;
        state.systemPromptVisible = s.systemPromptVisible;
        state.paramDefinitions = s.paramDefinitions;
        state.paramValues = s.paramValues;
        state.selectedModelId = s.selectedModelId;
        state.apis = s.apis || state.apis;

        systemPromptTextarea.value = s.systemPrompt;
        
        renderMessages();
        renderCustomParams();
        updateStandardParamUI();
        updateSelectedModelDisplay();
        
        toggleModal(managementModal, false);
        alert(`Workspace "${workspace.name}" loaded successfully.`);
    };

    const downloadBackup = () => {
        const includeApis = includeApisToggle.checked;
        const backupData = {
            workspaces: state.workspaces
        };
        if(includeApis) {
            backupData.apis = state.apis;
        }

        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.download = `ainz_ai_playground_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    const importBackup = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (!importedData.workspaces || !Array.isArray(importedData.workspaces)) {
                    throw new Error('Invalid format: Missing "workspaces" array.');
                }
                
                if (confirm('This will overwrite all current workspaces (and APIs if included). Are you sure?')) {
                    state.workspaces = importedData.workspaces;
                    if(importedData.apis && Array.isArray(importedData.apis)) {
                        state.apis = importedData.apis;
                    }
                    saveSettings();
                    renderWorkspaceList();
                    alert('Backup restored successfully!');
                }

            } catch (error) {
                alert(`Failed to import backup: ${error.message}`);
            }
        };
        reader.readAsText(file);
    };
    
    const saveWorkspace = () => {
        const name = workspaceNameInput.value.trim();
        if (!name) return alert('Please enter a name for the workspace.');

        const currentState = {
            messages: state.messages,
            systemPrompt: systemPromptTextarea.value,
            systemPromptVisible: state.systemPromptVisible,
            paramDefinitions: state.paramDefinitions,
            paramValues: state.paramValues,
            selectedModelId: state.selectedModelId,
        };
        
        state.workspaces.push({
            id: Date.now().toString(),
            name: name,
            savedAt: new Date().toISOString(),
            state: currentState
        });
        workspaceNameInput.value = '';
        saveSettings();
        renderWorkspaceList();
    };

    // --- Code Generation ---
    const generateCodeSnippet = () => {
        if (!state.lastRequestBody) {
            codeSnippetContent.textContent = "No request has been made yet.";
            return;
        }

        const { api, body } = state.lastRequestBody;
        const lang = languageSelector.value;
        let snippet = '';

        if (lang === 'bash') {
            snippet = `curl ${api.baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${api.apiKey}" \\
  -d '${JSON.stringify(body, null, 2)}'`;
        } else if (lang === 'javascript') {
            snippet = `const response = await fetch('${api.baseUrl}/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${api.apiKey}'
  },
  body: JSON.stringify(${JSON.stringify(body, null, 2)})
});

const data = await response.json();
console.log(data);`;
        }
        
        // Remove old language class and apply new one
        codeSnippetContent.removeAttribute('data-highlighted');
        codeSnippetContent.className = `text-sm language-${lang}`;
        codeSnippetContent.textContent = snippet;
        hljs.highlightElement(codeSnippetContent);
    };
    

    // --- Event Listeners ---
    modelSelectorDropdown.addEventListener('change', (e) => {
        state.selectedModelId = e.target.value;
    });

    document.addEventListener('click', (e) => {
        if (e.target.matches('.edit-api-btn')) {
            const api = state.apis.find(a => a.id === e.target.dataset.id);
            if(api) {
                apiFormTitle.textContent = 'Edit API';
                apiEditIdInput.value = api.id;
                apiNameInput.value = api.name;
                apiBaseUrlInput.value = api.baseUrl;
                apiKeyInput.value = api.apiKey;
                apiModelsContainer.classList.add('hidden');
            }
        }
        if (e.target.matches('.delete-api-btn')) {
            const apiId = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this API? This will also deactivate its models.')) {
                state.apis = state.apis.filter(a => a.id !== apiId);
                state.activeModels = state.activeModels.filter(m => m.apiId !== apiId);
                if (!state.activeModels.some(m => m.id === state.selectedModelId)) {
                    state.selectedModelId = null;
                }
                renderApiList();
                renderModelSelectorDropdown();
            }
        }
    });
    
    document.addEventListener('input', (e) => {
        if(e.target.matches('.model-nickname-input')) {
            const model = state.activeModels.find(m => m.id === e.target.dataset.id);
            if(model) {
                 model.nickname = e.target.value;
                 renderModelSelectorDropdown();
            }
        }
    });
    
    document.addEventListener('change', (e) => {
        if(e.target.matches('.model-enable-toggle')) {
            const model = state.activeModels.find(m => m.id === e.target.dataset.id);
            if(model) {
                model.enabled = e.target.checked;
                renderModelSelectorDropdown();
            }
        }
    });

    // Main Management Modal Listeners
    workspaceManagerBtn.addEventListener('click', () => {
        renderWorkspaceList();
        renderApiList();
        renderModelConfigList();
        switchManagementTab('workspaces');
        toggleModal(managementModal, true);
    });
    closeManagementModalBtn.addEventListener('click', () => {
        saveSettings();
        toggleModal(managementModal, false);
    });
    managementTabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchManagementTab(btn.dataset.tab));
    });
    saveWorkspaceBtn.addEventListener('click', saveWorkspace);
    fetchModelsBtn.addEventListener('click', fetchModelsForApi);
    modelSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        managementModal.querySelectorAll('#api-models-list .flex').forEach(item => {
            const modelId = item.querySelector('label').textContent.toLowerCase();
            item.style.display = modelId.includes(searchTerm) ? '' : 'none';
        });
    });

    // Code Snippet Listeners
    showCodeBtn.addEventListener('click', () => {
        generateCodeSnippet();
        codeSnippetBar.classList.remove('hidden');
        codeSnippetBar.classList.add('flex');
    });

    closeCodeBarBtn.addEventListener('click', () => {
        codeSnippetBar.classList.add('hidden');
        codeSnippetBar.classList.remove('flex');
    });

    languageSelector.addEventListener('change', generateCodeSnippet);

    copyCodeBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeSnippetContent.textContent).then(() => {
            copyCodeBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyCodeBtn.textContent = 'Copy';
            }, 2000);
        });
    });

    // Code Snippet Resizing Logic
    const startResizing = (e) => {
        e.preventDefault();
        window.addEventListener('mousemove', doResize);
        window.addEventListener('mouseup', stopResizing);
    };
    
    const doResize = (e) => {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight > 50 && newHeight < window.innerHeight * 0.8) { // Min/Max height constraints
            codeSnippetBar.style.height = `${newHeight}px`;
        }
    };
    
    const stopResizing = () => {
        window.removeEventListener('mousemove', doResize);
        window.removeEventListener('mouseup', stopResizing);
    };

    codeBarResizer.addEventListener('mousedown', startResizing);


    // Other listeners...
    // [The existing, correct event listeners for parameters, workspaces, etc. go here]
    // Stubs for brevity, will be replaced by full code.
    manageParamsBtn.addEventListener('click', () => {
        renderManageParamsList();
        resetParamForm();
        toggleModal(manageParamsModal, true);
    });
    closeManageParamsModalBtn.addEventListener('click', () => {
        saveSettings();
        toggleModal(manageParamsModal, false);
    });
    saveParamBtn.addEventListener('click', saveParameter);
    resetParamsBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all parameters to their defaults?')) {
            state.paramDefinitions = [...defaultParameters];
            state.paramValues = {};
            initializeParamValues();
            renderManageParamsList();
            renderCustomParams();
            updateStandardParamUI();
        }
    });
    showAddParamFormBtn.addEventListener('click', () => resetParamForm());
    paramTypeSelect.addEventListener('change', (e) => {
        paramNumberSliderFields.classList.toggle('hidden', e.target.value !== 'number');
    });
    temperatureSlider.addEventListener('input', (e) => {
        state.paramValues.temperature = parseFloat(e.target.value);
        temperatureValue.textContent = e.target.value;
    });
    topPSlider.addEventListener('input', (e) => {
        state.paramValues.top_p = parseFloat(e.target.value);
        topPValue.textContent = e.target.value;
    });
    maxTokensInput.addEventListener('change', (e) => {
        state.paramValues.max_tokens = parseInt(e.target.value, 10);
    });
    streamToggle.addEventListener('change', (e) => {
        state.paramValues.stream = e.target.checked;
    });
    addMessageBtn.addEventListener('click', () => addMessage());
    toggleSystemPromptBtn.addEventListener('click', () => {
        state.systemPromptVisible = !state.systemPromptVisible;
        systemPromptTextarea.classList.toggle('hidden', !state.systemPromptVisible);
        toggleSystemPromptBtn.classList.toggle('rotate-180', !state.systemPromptVisible);
    });
    addResponseToConvoBtn.addEventListener('click', () => {
        const responseText = state.rawResponse.trim();
        if (responseText) addMessage('assistant', responseText);
    });
    submitBtn.addEventListener('click', handleChatCompletion);
    stopBtn.addEventListener('click', () => {
        if (abortController) abortController.abort();
    });
    clearBtn.addEventListener('click', () => {
        state.messages = [];
        renderMessages();
        systemPromptTextarea.value = '';
        responseContentContainer.innerHTML = '';
        state.rawResponse = '';
        latencyEl.textContent = 'N/A';
        tokensPerSecondEl.textContent = 'N/A';
    });
    copyResponseBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(state.rawResponse)
            .then(() => {})
            .catch(err => console.error('Failed to copy:', err));
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            if (document.activeElement.tagName.toLowerCase() !== 'textarea') {
                handleChatCompletion();
            }
        }
    });

    // --- Initialization ---
    loadSettings();
    addMessage(); 
}); 