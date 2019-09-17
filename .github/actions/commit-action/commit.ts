import * as core from '@actions/core'
import * as github from '@actions/github'
import fetch from 'node-fetch'
import {GitCreateTreeParamsTree} from '@octokit/rest'

interface TreeEntry {
  path?: string
}

const run = async (): Promise<void> => {
  try {
    // Limit only to when issues are opened (not edited, closed, etc)
    // if (github.context.payload.action !== 'opened') return

    const issue = github.context.payload.issue
    if (!issue) return

    const emojiNames = (issue.body || '').split(',')
    console.log({emojiNames})

    // Create the octokit client
    const octokit: github.GitHub = new github.GitHub(process.env['GITHUB_TOKEN'] || '')
    const nwo = process.env['GITHUB_REPOSITORY'] || '/'
    const [owner, repo] = nwo.split('/')
    console.log({owner, repo})

    // Grab the emoji
    const githubEmojiResponse = await octokit.emojis.get()
    const githubEmojis: {[name: string]: string} = githubEmojiResponse.data
    console.log({githubEmojis})

    // Grab the ref for a branch (master in this case)
    // If you already know the sha then you don't need to do this
    // https://developer.github.com/v3/git/refs/#get-a-reference
    const ref = 'heads/master'
    const refResponse = await octokit.git.getRef({
      owner,
      repo,
      ref,
    })
    const sha = refResponse.data.object.sha
    console.log({sha})

    // Grab the current tree so we can see the list of paths
    // https://developer.github.com/v3/git/trees/#get-a-tree-recursively
    const baseTreeResponse = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: sha,
    })
    const paths: Array<string> = baseTreeResponse.data.tree.map((item: TreeEntry) => {
      return item.path
    })
    console.log({paths})

    // Keep track of the entries for this commit
    const tree: Array<GitCreateTreeParamsTree> = []

    // Loop through all of the emoji names in the issue body
    // 1. Is this a valid emoji name?
    // 2. Is the emoji already in the repo? If so, just reuse it
    // 3. Is the emoji new? Download the content and add a new entry
    for (let i = 0; i < emojiNames.length; i++) {
      const name = emojiNames[i]
      // Is this a valid emoji name?
      if (!githubEmojis[name] || name === '+1' || name === '-1') {
        console.log(`Invalid emoji name: ${name}`)
        continue
      }
      // Does it already exist, if so, no changes
      const fileName = `${name}.png`
      if (paths.indexOf(fileName) >= 0) {
        continue
      }
      // Download and convert to base64
      const emojiFileResponse = await fetch(githubEmojis[name])
      const emojiFileBuffer = await emojiFileResponse.buffer()
      const content = emojiFileBuffer.toString('base64')
      console.log(`CONTENT FOR: ${name}`)
      console.log({content})

      // If you have a large amount of data to commit it is sometimes
      // better to create a sha for each file individually. You can then
      // use the created blob shas to construct the tree. You _must_ do
      // this when the content is non-text
      // https://github.com/octokit/rest.js/issues/1313#issuecomment-531911534
      const blobResponse = await octokit.git.createBlob({
        owner,
        repo,
        encoding: 'base64',
        content,
      })
      const blobSha = blobResponse.data.sha

      // Add the sha of each blob as a tree entry. We can't use the contents directly
      // for each tree entry because the files are binary
      tree.push({
        path: fileName,
        mode: '100644',
        type: 'blob',
        sha: blobSha,
        //content: content, // if your content is small and not-binary you could push directly
      })
    }

    // Optional: Add entries to remove deleted paths from the tree
    //
    // Loop through the all of the paths (from baseTree) and check that the
    // path still exists in the submitted emojiNames. If not, push a tree entry
    // to the array
    // {
    //   owner,
    //   repo,
    //   path: fileName,
    //   sha: null, // indicates this path should be deleted in the new tree
    // }

    // Create the tree using the collected tree entries
    // https://developer.github.com/v3/git/trees/#create-a-tree
    const treeResponse = await octokit.git.createTree({
      owner,
      repo,
      base_tree: sha,
      tree: tree,
    })
    console.log({treeResponse: treeResponse.data})

    // Commit that tree
    // https://developer.github.com/v3/git/commits/#create-a-commit
    const message = `Update emoji. Fixes #${issue.number}`
    const commitResponse = await octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: treeResponse.data.sha,
      parents: [sha],
    })

    console.log(`Commit complete: ${commitResponse.data.sha}`)

    // The commit is complete but it is unreachable
    // We have to update master to point to it
    // https://developer.github.com/v3/git/refs/#update-a-reference
    const updateRefResponse = await octokit.git.updateRef({
      owner,
      repo,
      ref: 'heads/master',
      sha: commitResponse.data.sha,
      force: false,
    })
    console.log({updateRefResponse: updateRefResponse.data})
    console.log('Done')
  } catch (error) {
    core.setFailed(`Debug-action failure: ${error}`)
  }
}

run()

export default run
