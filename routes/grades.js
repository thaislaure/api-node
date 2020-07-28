import express from "express";
import { promises } from "fs";

const router = express.Router();

const readFile = promises.readFile;
const writeFile = promises.writeFile;

router.post("/", async (req, res) => {
    let grade = req.body;
    try {
        let json = JSON.parse(await readFile(global.fileName, "utf8"));

        grade = { id: json.nextId++, timestamp: new Date(), ...grade };
        json.grades.push(grade);

        await writeFile(global.fileName, JSON.stringify(json));

        res.send(grade);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

router.put("/", async (req, res) => {
    try {
        let newGrade = req.body;

        let json = JSON.parse(await readFile(global.fileName, "utf8"));
        let index = json.grades.findIndex(grade => grade.id === newGrade.id);

        if (index === -1) {
            throw new Error("ID não existente.")
        }

        if (newGrade.student) {
            json.grades[index].student = newGrade.student;
        }
        if (newGrade.subject) {
            json.grades[index].subject = newGrade.subject;
        }
        if (newGrade.type) {
            json.grades[index].type = newGrade.type;
        }
        if (newGrade.value) {
            json.grades[index].value = newGrade.value;
        }

        await writeFile(global.fileName, JSON.stringify(json));

        res.send(json.grades[index]);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        let json = JSON.parse(await readFile(global.fileName, "utf8"));

        let index = json.grades.findIndex(grade => grade.id === parseInt(req.params.id, 10));
        if (index === -1) {
            throw new Error("ID não existente.");
        }

        //const grades = json.grades.filter(grade => grade.id !== parseInt(req.params.id, 10));
        //json.grades = grades;

        json.grades.splice(index, 1);

        await writeFile(global.fileName, JSON.stringify(json));

        res.end();
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        let json = JSON.parse(await readFile(global.fileName, "utf8"));

        const grade = json.grades.find(grade => grade.id === parseInt(req.params.id, 10));
        if (grade) {
            res.send(grade);
        } else {
            throw new Error("ID não existente.");
        }
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

router.post("/totalByStudentAndSubject", async (req, res) => {
    try {
        const json = JSON.parse(await readFile(global.fileName, "utf8"));
        const grades = json.grades.filter(grade => grade.student === req.body.student &&
            grade.subject === req.body.subject);
        const total = grades.reduce((prev, curr) => {
            return prev + curr.value
        }, 0);
        res.send({ total });
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

router.get("/average/:subject/:type", async (req, res) => {
    try {
        const json = JSON.parse(await readFile(global.fileName, "utf8"));    
        const grades = json.grades.filter(grade => grade.subject === req.params.subject &&
            grade.type === req.params.type);

        if (!grades.length) {
            throw new Error("Não foram encontrados registros para os parâmetros informados.");
        }

        const total = grades.reduce((prev, curr) => {
            return prev + curr.value
        }, 0);
        
        res.send({average: total / grades.length});
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

router.post("/best", async (req, res) => {
    try {
        const json = JSON.parse(await readFile(global.fileName, "utf8"));  
        const grades = json.grades.filter(grade => grade.subject === req.body.subject &&
            grade.type === req.body.type);
        
        if (!grades.length) {
            throw new Error("Não foram encontrados registros para os parâmetros informados.");
        }            

        grades.sort((a, b) => {
            if (a.value < b.value) return 1;
            else if (a.value > b.value) return -1;
            else return 0;
        });

        res.send(grades.slice(0, 3));
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

export default router;