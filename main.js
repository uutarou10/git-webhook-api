const exec = require('child_process').exec
const express = require('express');
const app = express();
app.use(express.json())
app.use(require('morgan')(':method :url :status :res[content-length] - :response-time ms'))

const REPO_URL = process.env.REPO_URL
const EXEC_CMD = process.env.EXEC_CMD
const PORT = parseInt(process.env.PORT) || 8888
const TARGET_BRANCH = process.env.TARGET_BRANCH || 'master'

if (!REPO_URL && !EXEC_CMD) {
  console.error('Error: Missed required env variable.')
  process.exit(1)
}

app.post('/push', (req, res) => {
  if (isValidRequest(req.body)) {
      res.sendStatus(202)
  } else {
      console.log(new Date(), 'Bad request.')
      return res.sendStatus(400) 
  }

  // target branchではなかったら終了
  if (!isExpectedBranch(req.body)) {
    return 
  }

  cloneRepository(REPO_URL).then(() => {
    console.log(new Date(), 'Cloned repository.')
    execCommand(EXEC_CMD).then((stdout) => {
      console.log(new Date(), "Command executed.\n" + stdout)
    })
  })
})

app.listen(PORT, () => {
  console.log(`Running server on port ${PORT}.`)
  console.log({
    REPO_URL,
    EXEC_CMD,
    TARGET_BRANCH
  })
})

// REPO_URLに指定されたリポジトリかどうかを返す
const isValidRequest = (reqBody) => {
  const repoUrls = [
    reqBody.repository.git_url,
    reqBody.repository.ssh_url,
    reqBody.repository.clone_url
  ]

  return repoUrls.includes(REPO_URL)
}

// TARGET_BRANCHに指定したブランチに対するPushかどうかを返す
const isExpectedBranch = (reqBody) => {
  return reqBody.ref === `refs/heads/${TARGET_BRANCH}`
}

// repoUrlのリポジトリをクローンする
const cloneRepository = (repoUrl) => {
  return new Promise((resolve, reject) => {
    exec(`rm -rf ./repository && git clone ${repoUrl} repository`, (err, stdout, stderr) => {
      if (err) {
        reject('Error: Faild clone repository.\n<stderr>\n' + stderr)
      } else {
        resolve()
      }
    })
  })
}

// commandを実行する
const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: './repository' }, (err, stdout, stderr) => {
      if (err) {
        reject('Error: Specified command returned non zero exit code.\n<stderr>\n' + stderr)
      } else {
        resolve(stdout)
      }
    })
  })
}