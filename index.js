require("dotenv").config();
const express = require("express");
const app = express();
const Person = require("./models/person");

let persons = [
  {
    id: "1",
    name: "Arto Hellas",
    number: "040-123456",
  },
  {
    id: "2",
    name: "Ada Lovelace",
    number: "39-44-5323523",
  },
  {
    id: "3",
    name: "Dan Abramov",
    number: "12-43-234345",
  },
  {
    id: "4",
    name: "Mary Poppendieck",
    number: "39-23-6423122",
  },
];

app.use(express.static("dist"));

const cors = require("cors");
app.use(cors());

app.use(express.json());

const morgan = require("morgan");
morgan.token("content", function (req, res) {
  return JSON.stringify(req.body);
});
app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :content"
  )
);

app.get("/info", async (req, res, next) => {
  try {
    const time = new Date();
    const numberOfPersons = await Person.countDocuments({});

    res.send(
      `<p>Phonebook has info for ${numberOfPersons} person/s</p>
        <p>${time}</p>`
    );
  } catch (error) {
    next(error);
  }
});

app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.get("/api/persons", (req, res) => {
  Person.find({}).then((persons) => {
    res.json(persons);
  });
});

app.get("/api/persons/:id", (req, res, next) => {
  const id = req.params.id;
  Person.findById(id)
    .then((person) => {
      if (person) {
        res.json(person);
      } else {
        res.status(404).end();
      }
    })
    .catch((error) => next(error));
});

app.delete("/api/persons/:id", (req, res, next) => {
  const id = req.params.id;

  // persons = persons.filter((person) => person.id !== id);
  Person.findByIdAndDelete(id)
    .then((result) => {
      res.status(204).end();
    })
    .catch((error) => next(error));
});

const generateId = () => {
  while (true) {
    const newId = Math.floor(Math.random() * 1000000);

    if (!persons.some((person) => person.id === newId)) return String(newId);
  }
};

app.post("/api/persons", (req, res, next) => {
  const body = req.body;
  if (!(body.name && body.number))
    return res.status(400).json({ error: "Name and/or number are missing" });

  // if needed, revise to work with MongoDB
  // const isDuplicate = persons.some(
  //   (person) => person.name.toLowerCase() === body.name.toLowerCase()
  // );
  // if (isDuplicate)
  //   return res.status(409).json({ error: "Name already exists" });

  const newPerson = new Person({
    name: body.name,
    number: body.number,
    id: generateId(),
  });

  newPerson
    .save()
    .then((savedPerson) => {
      res.json(savedPerson);
    })
    .catch((error) => next(error));
});

app.put("/api/persons/:id", (req, res, next) => {
  const { name, number } = req.body;

  Person.findByIdAndUpdate(
    req.params.id,
    { name, number },
    {
      new: true,
      runValidators: true,
      context: "query",
    }
  )
    .then((updatedPerson) => {
      if (updatedPerson) {
        res.json(updatedPerson);
      } else {
        res.status(404).end();
      }
    })
    .catch((error) => next(error));
});

app.use((req, res) => {
  res.status(404).send({ error: "unknown endpoint" });
});

const errorHandler = (error, req, res, next) => {
  console.error(error.name, error.message);
  if (error.name === "CastError") {
    return res
      .status(400)
      .send({ error: "malformatted id", errorType: error.name });
  } else if (error.name === "ValidationError") {
    return res
      .status(400)
      .json({ error: error.message, errorType: error.name });
  }

  next(error);
};

app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
