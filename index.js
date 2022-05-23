const fs = require("fs")
const ObjectsToCsv = require('objects-to-csv')
const { exec } = require('child_process')

const CdcFileType = {
    CONTRACT: "contract",
    TRANSACTION: "transaction",
    SCRIPT: "script"
}

const blankAddress = "0000000000000000"

function parseLocation(name, dir) {
    let prefix = ""
    switch (dir) {
        case CdcFileType.CONTRACT:
            prefix = "A"
            break
        case CdcFileType.TRANSACTION:
            prefix = "t"
            break
        case CdcFileType.SCRIPT:
            prefix = "s"
            break
        default:
            break
    }
    const substring = ".cdc"
    if (!name.includes(substring)) return name
    return `${prefix}.${blankAddress}.${name.replace(substring, "")}`
}

function replaceImports(file) {
    const lines = file.split("\n")
    const editedLines = lines.map((l) => {
        // console.log(l)
        if (l.includes("import") && l.includes("from")) {
            const segs = l.split(" ")
            let newLine = ""
            segs.forEach(s => {
                if (s.startsWith("0x") || s.startsWith(`"./`) || s.startsWith(`"../`)) {
                    newLine = newLine.concat(`0x${blankAddress} `)
                    return
                }
                newLine = newLine.concat(`${s} `)
            })
            return newLine
        }
        return l
    })
    return editedLines.join("\n")
}

function readCdcFiles(dir) {
    const d = `${dir}/`
    return fs.readdirSync(d).map(n => {
        const location = parseLocation(n, dir)
        const code = fs.readFileSync(d + n, "ascii")
        const standardized = replaceImports(code)

        return { location, code: standardized }
    })
}

// function readDirs(dirs) {
//     return dirs.map(dir => {
//         return readCdcFiles(dir)
//     })
// }

(async () => {
    const contracts = readCdcFiles("contract")
    const transactions = readCdcFiles("transaction")
    const scripts = readCdcFiles("script")

    let datasets = []
    datasets.push(...contracts)
    datasets.push(...transactions)
    datasets.push(...scripts)

    const csv = new ObjectsToCsv(datasets)
    await csv.toDisk('./output/output.csv')

    exec('cadence-analyzer -csv ./output/output.csv', (err, stdout, stderr) => {
        if (err) {
            //some err occurred
            console.error(err)
        } else {
            // the *entire* stdout and stderr (buffered)
            console.log(`stdout: ${stdout}`)
            console.log(`stderr: ${stderr}`)
        }
    })
})()

