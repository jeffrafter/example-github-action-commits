# Example GitHub Action with Commits

This is a strange GitHub action that automatically commits emoji images into your master branch.

Why would you want that? I have no idea.

The action and workflow both live in this repository (I haven't released this action... because again: _why_?).

- [Action](https://github.com/jeffrafter/example-github-action-commits/blob/master/.github/actions/commit-action/commit.ts)
- [Workflow](https://github.com/jeffrafter/example-github-action-commits/blob/master/.github/workflows/commit-workflow.yml)

This is mostly here to demonstrate interactions with payloads, committing via the API and responding to issues. Steal liberally. Open an issue... in the body create a list of emoji names (separated by commas). The action will automatically add them to the repo and close the issue.

![](https://rpl.cat/uploads/bD5Elq8UL6Ujn-Rd1zgnMBGE7NoMsC0HhvNoaDiDWdc/public.png)

License: you are as free as the wind. Public domain.
