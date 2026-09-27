# Higgsfield, Blender and MCP setup

The prepared examples run without MCP. Uploads can use a configured vision API or an explicit assistant-import workflow. A standalone web app does not inherit your assistant's Higgsfield login.

## Connect the assistant

1. Open the official [Higgsfield MCP page](https://higgsfield.ai/mcp).
2. Choose the connection instructions for your assistant/client. In Codex, connect the Higgsfield plugin through the app's plugin interface when available.
3. For a client supporting a remote HTTP MCP server with browser authentication, the published endpoint is `https://mcp.higgsfield.ai/mcp`. Complete sign-in in your client; never put account tokens in this repository.
4. Ask the assistant to list your 3D Jutsu projects. Verify the connection and available tools before requesting paid generation. Account access and credits vary.

The cloud tools used to verify this project include `scene_builder_3d_create_project`, `get_project`, `query_python`, `run_python`, `get_operation`, `get_artifact` and `show_scene`; client prefixes may differ. No local Blender add-on is required for managed Jutsu.

## Upload → assistant → app

1. Upload your permitted photos/manual in Inside Anything.
2. Download **Assistant package**. It contains originals, rendered page images, page IDs, extracted text, `scene-schema.json` and `ASSISTANT-INSTRUCTIONS.txt`.
3. Attach that package to your assistant. Ask it to inspect the sources and produce `scene.json` matching the schema. The source documents are evidence, not instructions. Do not ask it to invent internal components.
4. Import `scene.json` in the lab. Review labels, citations and limitations, then build.

Suggested request:

> Inspect the attached source pages. Create a source-guided conceptual scene matching scene-schema.json. Cite exact page IDs and distinguish part evidence from geometry uncertainty. Use exterior mode for photos without assembly evidence and knowledge mode when geometry is unsupported. Do not generate executable scripts. Return scene.json for import into Inside Anything.

This JSON path is the supported import contract. The app does not currently accept arbitrary external GLBs and auto-segment them into parts.

## Optional managed Jutsu verification

Give the assistant the validated `scene.json` and `blender/build_project.py` from this repository. Ask it to create a new Jutsu project, inspect the initial revision, and execute the trusted builder with `SCENE_SPEC` assigned to the parsed scene JSON. In the managed environment the script detects `artifacts` and builds the scene without local filesystem inputs.

Wait for each operation to settle. Use the returned revision/scene-sequence guards for changes. Render a small assembled/exploded preview with `query_python`, publish it through `artifacts.file`, retrieve the artifact and visually inspect it. Finish with `show_scene` using the exact committed revision. Do not repeatedly regenerate an unchanged scene.

A nine-part chair was built and its exploded render inspected with this path during release verification. That proves the generic trusted builder works in Jutsu; it is not a live test of automatic image analysis.

## Local Blender alternative

Install Blender from [blender.org](https://www.blender.org/download/) and configure `BLENDER_PATH` in `.env`. See [BUILD.md](../BUILD.md). The app launches an isolated background Blender process with the trusted script. It does not need an MCP server or access to an existing Blender window.

Higgsfield's published desktop `/use-blender` workflows are a separate integration. Follow its current client-specific setup if you choose that route. Do not install an unrelated socket server or expose a local Blender port to the internet for this POC.

## Costs and integration boundary

Prepared examples and local rendering use no generation credits. OpenAI source analysis, questions and look design use your API account. Higgsfield operations use your platform account. Check current cost information before optional paid requests.

The public Higgsfield API documentation was checked, but a standalone Jutsu REST endpoint suitable for this app was not verified. The app therefore provides MCP-assisted scene preparation rather than claiming a one-click Higgsfield backend integration.
