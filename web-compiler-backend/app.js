const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const solc = require('solc');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(cors());

const expectedOutputs = {
  easy: { solidity: "expectedOutput1", rust: "expectedOutput2", motoko: "expectedOutput3" },
  medium: { solidity: "expectedOutput4", rust: "expectedOutput5", motoko: "expectedOutput6" },
  hard: { solidity: "expectedOutput7", rust: "expectedOutput8", motoko: "expectedOutput9" }
};

const points = { easy: 1, medium: 2, hard: 3 };


const rustcPath = 'C:\\Users\\toshi\\.cargo\\bin\\rustc'; 

app.post('/compile/:language', (req, res) => {
  const { language } = req.params;
  const { code, difficulty } = req.body;

  // Solidity compilation logic
if (language === 'solidity') {
    const input = {
        language: 'Solidity',
        sources: {
            'test.sol': {
                content: code
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            }
        }
    };

    try {
        const output = JSON.parse(solc.compile(JSON.stringify(input)));
        if (output.errors) {
            return res.json({ compiledOutput: 'Compilation error: ' + output.errors.join('\n'), points: 0 });
        }
        const compiledOutput = output.contracts && output.contracts['test.sol'] ? 'Success' : 'Failure';

        if (compiledOutput === expectedOutputs[difficulty][language]) {
            res.json({ compiledOutput: 'Success', points: points[difficulty] });
        } else {
            res.json({ compiledOutput: 'Failure', points: 0 });
        }
    } catch (error) {
        res.json({ compiledOutput: 'Compilation error: ' + error.message, points: 0 });
    }
}

    else if (language === 'rust') {
    const filePath = path.join(__dirname, 'temp.rs');
    const outputFilePath = path.join(__dirname, 'temp.exe');

    fs.writeFileSync(filePath, code);

    exec(`${rustcPath} ${filePath} -o ${outputFilePath}`, (compileError, stdout, stderr) => {
      if (compileError) {
        return res.json({ compiledOutput: 'Compilation error: ' + stderr });
      }

      exec(outputFilePath, (runError, runStdout, runStderr) => {
        if (runError) {
          return res.json({ compiledOutput: 'Runtime error: ' + runStderr });
        }

        return res.json({ compiledOutput: runStdout });
      });
    });
  } else if (language === 'motoko') {
    // Add Motoko logic here
  } else {
    res.status(400).json({ error: 'Unsupported language' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
