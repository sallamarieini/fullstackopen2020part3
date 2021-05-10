require('dotenv').config()
const morgan = require('morgan')
const Person = require('./models/person')
const express = require('express')
const cors = require('cors')
const {response} = require('express')
const app = express()

morgan.token('content', function getContent (req) {
    if (req.method === 'POST') {
        return JSON.stringify(req.body)
    }
})

app.use(express.json())
app.use(cors())
app.use(express.static('build'))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :content'))

const errorHandler = (error, request, response, next) => {
    console.error(error.message)
  
    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'BadRequest') {
        return response.status(400).json({error: error.message})
    } else if (error.name === 'ValidationError') {
        return response.status(406).json({error: error.message})
    }
  
    next(error)
}

app.get('/api/persons', (req, res) => {
    Person.find({}).then(persons => {
        res.json(persons)
    })
})

app.get('/info', (req, res) => {
    Person.find({}).then(persons => {
        res.send(
            `<p> Phonebook has info for ${persons.length} people </p>
             <p> ${Date()} </p>`
        )
    })
})

app.get('/api/persons/:id', (req, res, next) => {
    Person.findById(req.params.id)
        .then(person => {
            if(person) {
                res.json(person.toJSON())
            } else{
                res.status(404).end()
            }
        })
        .catch(error => next(error))

})

app.post('/api/persons', (req, res, next) =>{
    const body = req.body

    if (!body.name || !body.number) {
        return res.status(400).json({
            error: 'name or number missing'
        })
    }
    
    /*if (persons.find(p => p.name === body.name)) {
        return res.status(400).json({
            error: 'name must be unique'
        })
    }*/

    const person = new Person({
        name : body.name,
        number: body.number
    })

    console.log(person)

    person.save().then(savedPerson => {
        res.json(savedPerson)
    })
    .catch((error) => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
    Person.findByIdAndRemove(req.params.id)
        .then(result => {
            res.status(204).end()
        })
        .catch((error) => next(error))
})

app.put('/api/persons/:id', (req, res, next) => {
    const body = req.body
    
    const person = {
        name: body.name,
        number: body.number
    }

    Person.findByIdAndUpdate(req.params.id, person, {new: true, runValidators: true, context: 'query'})
        .then(updatedPerson => {
            res.json(updatedPerson)
        })
        .catch(error => next(error))

})

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}
  
app.use(unknownEndpoint)

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})