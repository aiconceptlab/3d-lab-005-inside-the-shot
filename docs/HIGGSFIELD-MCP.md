# Higgsfield, Blender and MCP setup

The released app already includes its assets. **MCP is needed only if you want an AI assistant to create or edit the scene through Higgsfield.** The local Blender script is a second, fully reproducible build path.

## Connect Higgsfield

1. Sign in to your Higgsfield account.
2. Open the official [Higgsfield MCP page](https://higgsfield.ai/mcp). Choose your supported assistant: its page offers ChatGPT, Claude, Claude Code and other clients. In Codex, install/connect the Higgsfield plugin from the app's plugin interface when available.
3. For a client that supports an HTTP MCP server with browser authentication, use the published server URL: **`https://mcp.higgsfield.ai/mcp`**. Complete the account sign-in/authorization in your client. Never put account tokens in this repository or paste them into a public issue.
4. Verify that the connected assistant can list your 3D Jutsu projects before asking it to edit anything. Tool availability depends on the client and account. The direct 3D Jutsu tools used here are `scene_builder_3d_create_project`, `get_project`, `query_python`, `run_python`, `get_operation`, `get_glb`, `get_blend` and `show_scene` (your client may prefix their names).

## Rebuild in 3D Jutsu

Give the assistant `blender/build_scene.py` and this request:

> Create a new 3D Jutsu project named Inside the Shot. Inspect its initial scene and use the returned revision and scene sequence as edit guards. Run the supplied Blender script in the managed scene. Preserve the fourteen semantic groups, metre units, portable materials and prepared animation. Wait for the operation to finish, inspect rendered assembled and exploded previews, then deliver the editable scene and exact committed revision. Do not claim the concept is a reconstruction of a real machine.

The build script detects the Jutsu `artifacts` registry and commits geometry first. Once it settles, run `blender/higgsfield_preview.py` through `scene_builder_3d_query_python` to publish a small exploded preview. This separation avoids a long render consuming the mutation worker's time limit. Do not submit a second mutation while the first is active. Retrieve the published preview and inspect its pixels before accepting a scene. Retrieve GLB/Blender outputs after the final committed edit. Signed download links expire; save the actual files.

The managed cloud path does **not** need a local Blender add-on. This build also provides a normal `.blend` file that can be opened and edited in desktop Blender without any MCP server.

## Optional desktop workflow

Higgsfield also documents an [Exploded-view workflow](https://higgsfield.ai/mcp/exploded-view?tab=claude) with its `/use-blender` integration. Its published steps require the supported desktop client, a connected Higgsfield account and Blender on the same computer. Follow the current workflow's own integration instructions; cloud Jutsu tools do not automatically gain access to your local Blender window. Work on a copy of `arc.blend` and provide the source assets explicitly.

This repository does not ask you to install an unrelated third-party Blender socket server or expose a local port to the internet. The tested no-MCP alternative is the background Blender command in `BUILD.md`.

## Costs and limits

The prepared browser demonstration costs no generation credits. Editing on Higgsfield and optional OpenAI interpretation may consume your account's credits or API budget. Check the platform's current estimate and plan before running paid generations. Do not substitute a regenerated video for the editable assembly and claim it contains inspectable geometry.
