const fs = require("fs")
const ObjectsToCsv = require('objects-to-csv')
const { exec } = require('child_process')

// set to correct dirs
const dirs = ["contract", "transaction", "script"]

function parseLocation(name, dir) {
    let prefix = ""
    switch (dir) {
        case dirs[0]:
            prefix = "A"
            break
        case dirs[1]:
            prefix = "t"
            break
        case dirs[2]:
            prefix = "s"
            break
        default:
            break
    }
    const address = "0000000000000000" // I don't think this matters
    const substring = ".cdc"
    if (!name.includes(substring)) return name
    return `${prefix}.${address}.${name.replace(substring, "")}`
}

function readCdcFiles(dir) {
    const d = `${dir}/`
    return fs.readdirSync(d).map(n => {
        const location = parseLocation(n, dir)
        return { location, code: fs.readFileSync(d + n, "ascii") }
    })
}

function readDirs(dirs) {
    return dirs.map(dir => {
        return readCdcFiles(dir)
    })
}

(async () => {
    const datasets = readDirs(dirs)

    // map data sets to a 1d array
    const data = []
    datasets.forEach(group => {
        group.forEach(d => {
            data.push(d)
        })
    })

    const csv = new ObjectsToCsv(data)
    await csv.toDisk('./output.csv')

    exec('cadence-analyzer -csv ./output.csv', (err, stdout, stderr) => {
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
