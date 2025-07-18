# Ainz AI Playground 🚀

A versatile, browser-based interface designed for developers and AI enthusiasts to interact with various Large Language Model (LLM) APIs. This playground provides a single, highly customizable environment to test different models, fine-tune parameters, and manage complex conversation chains.

**Live Demo:** **[https://ai.ainz.uk](https://ai.ainz.uk)**

*Your data, including API keys and workspaces, is stored securely and privately in your browser's local storage.*


---

## Features

* **🔀 Multi-API & Model Management**: Add multiple API providers (like OpenAI, Groq, etc.). Fetch their models, give them custom nicknames, reorder them, and toggle their availability in the main dropdown.
* **💾 Workspace Management**: Save your entire session—including the system prompt, conversation history, parameters, and selected model—as a named workspace. Load it back anytime to continue where you left off.
* **💬 Dynamic Conversation Chains**: Build and edit multi-turn conversations. Easily switch message roles (user/assistant), add new messages, or delete existing ones.
* **🎛️ Advanced Parameter Control**: Fine-tune your requests with standard parameters like `temperature`, `top_p`, and `max_tokens`. You can also add and manage any custom parameter supported by your chosen API.
* **💻 Code Snippet Generation**: Instantly generate `cURL` or `JavaScript (Fetch)` code snippets for any request you make, making it easy to transfer your work from the playground to your application.
* **⚡ Real-time Streaming**: Get instant feedback with support for streamed API responses, showing latency and tokens-per-second metrics.
* **🔄 Backup & Restore**: Download a single JSON file containing all your workspaces and settings. You can also restore your setup from a backup file, making it easy to move between browsers or machines.

---

## Guide to the Playground

### 1. The Management Panel: Your Control Center

Open the Management Panel by clicking the **globe icon (🌐)** in the header. This is where you configure the core of the playground.

* **APIs Tab**: This is your first stop.
    * Add a new API provider by entering a **Name** (e.g., "My OpenAI Key"), the provider's **Base URL** (e.g., `https://api.openai.com/v1`), and your **API Key**.
    * Click **Fetch & Activate Models** to save the API and automatically add all its available models to your playground.

* **Models Tab**:
    * After adding an API, this tab lists all its models.
    * **Drag and drop** to reorder models as they appear in the main dropdown.
    * Set a **nickname** for any model for easier identification (e.g., "GPT-4 Turbo" instead of `gpt-4-1106-preview`).
    * Use the **toggle** to enable or disable models from appearing in the selection dropdown.

* **Workspaces Tab**:
    * A workspace saves your entire session: the system prompt, the full conversation chain, all parameter settings, and the selected model.
    * Give your current session a name and click **Save Current** to store it.
    * Load any saved workspace to instantly restore that exact session.

* **Backup & Restore Tab**:
    * **Download Backup**: Export all your settings (Workspaces, APIs, etc.) into a single JSON file. You can choose whether to include your API keys for a complete transfer.
    * **Import from File**: Restore your entire configuration from a previously downloaded backup file. **Warning**: This will overwrite existing data.

### 2. Fine-Tuning with Parameters

The right-hand panel gives you granular control over the AI's responses.

* **Standard Parameters**:
    * **Temperature**: Controls randomness. Lower values (e.g., `0.2`) make the output more deterministic and focused. Higher values (e.g., `1.5`) encourage more creative and diverse responses.
    * **Top P**: An alternative to temperature that controls the nucleus of sampling. A value of `0.1` means only tokens comprising the top 10% probability mass are considered.
    * **Max Tokens**: Sets a hard limit on the length of the generated response.
    * **Stream**: Toggles real-time streaming of the response.

* **Custom Parameters**:
    * Click the **Manage** button in the Parameters panel to open a modal.
    * Here, you can add any other parameter your chosen API supports (e.g., `presence_penalty`, `stop_sequences`).
    * Define the parameter's **key**, **data type** (slider, toggle, text input), and a **default value**. It will then appear in the right-hand panel for you to use.

### 3. From Playground to Code

Once you've perfected a prompt and its settings, you can easily integrate it into your own applications.

* Click the **code icon (`</>`)** in the top-right of the **RESPONSE** panel.
* A resizable bar will appear at the bottom showing the code for your *last submitted request*.
* You can switch between `cURL` for terminal testing and `JavaScript (Fetch)` for web development.
* Click **Copy** to grab the code and go.

### 4. Prompt Engineering Techniques

Use the playground's features to craft the perfect prompt.

* **Master the System Prompt**: The `SYSTEM` input is the most powerful tool. Use it to define the AI's persona, role, task, and constraints. Be specific about the tone, format, and rules it must follow throughout the entire conversation.
* **Build a Conversation Chain**: Don't just ask one-off questions. Use the `Add Message` button to build a dialogue. You can guide the AI by providing examples of both `user` questions and ideal `assistant` responses (this is called few-shot prompting).
* **Iterate and Refine**: The key to good prompting is iteration.
    1.  Start with a simple prompt.
    2.  Analyze the response. Is it missing something? Is the tone wrong?
    3.  Adjust the `SYSTEM` prompt or add/edit messages in the chain to correct its course.
    4.  Tweak parameters like `temperature` to see how it affects the outcome.
    5.  Once you achieve a great result, **save it as a Workspace** to create a library of effective prompts.

### 5. Example Usage: Creating a Sarcastic Assistant

Let's walk through creating and testing an AI persona.

1.  **Set the Persona**: In the `SYSTEM` prompt box, type:
    ```
    You are a sarcastic, dry-witted assistant. You answer user questions correctly, but always with a layer of wit and mild condescension. You are unimpressed by everything.
    ```
2.  **Start the Conversation**: Click `Add Message` to create the first `USER` message and type:
    ```
    What's the current time in Marrakesh?
    ```
3.  **Adjust Parameters**: For a creative persona, let's increase the `Temperature` to `1.2` to give the AI more freedom.
4.  **Submit and Analyze**: Hit `Submit`. You should get a response that is both accurate and sarcastic, like:
    > "Oh, you need me to tell you the time? Groundbreaking. As of my last, thrilling update, it's 9:28 PM. I trust you can handle it from here."
5.  **Continue the Chain**: Click the **plus icon (`+`)** in the response panel to add the AI's reply to the conversation. Now, add another `USER` message to test if the persona holds up:
    ```
    Thanks, that was helpful.
    ```
6.  **Submit Again**: The AI should continue its sarcastic persona:
    > "Helpful? I live to serve. It's the sole reason for my vast, computational existence, after all."
7.  **Save Your Work**: Happy with your sarcastic bot? Open the **Management Panel (🌐)**, go to the **Workspaces** tab, name it "Sarcastic Assistant", and click **Save Current**. You can now load this persona back any time.
