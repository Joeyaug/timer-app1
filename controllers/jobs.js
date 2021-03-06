/* eslint-disable no-unused-vars */
const jobRouter = require('express').Router()
const { request, response } = require('express')
const Job = require('../models/job')
const Punch = require('../models/punch')
const { get_user_from_request } = require('./utils')


jobRouter.post('/api/jobs', async (request, response) => {

  const data = request.body

  const curr_user = await get_user_from_request(request)
  if (!curr_user) return response.status(401).json({ error:'missing or invalid token' })

  const new_job = new Job({ title: data.title, punches:[], punched_in: false })

  new_job.user = curr_user
  curr_user.jobs = [...curr_user.jobs, new_job]

  await curr_user.save()
  const created_job = await new_job.save()

  response.status(201).json({ message: 'ok' })
})

jobRouter.get('/api/jobs', async (request, response) => {

  const curr_user = await get_user_from_request(request)
  if (!curr_user) return response.status(401).json({ error:'missing or invalid token' })

  const allJobs = await Job.find({ user: curr_user })

  response.status(200).json(allJobs)
})

jobRouter.get('/api/jobs/:job_id', async (request, response) => {

  const curr_user = await get_user_from_request(request)
  if (!curr_user) return response.status(401).json({ error:'missing or invalid token' })

  const curr_job_id = request.params.job_id

  const curr_job = await Job.findById(curr_job_id)

  const punches_id = curr_job.punches


  let punches = []

  for(let i =0; i<punches_id.length;i++){
    const id = punches_id[i]
    const next_punch = await Punch.findById(id)
    const punch_json = {
      id: next_punch.id,
      punched_in: next_punch.createdAt,
      punched_out: next_punch.active ? null : next_punch.updatedAt
    }
    punches = [...punches, punch_json]
  }

  const object_to_return = {
    title: curr_job.title,
    punches,
    punched_in: curr_job.punched_in
  }

  response.status(200).json(object_to_return)
})


jobRouter.delete('/api/jobs/:id', async (request, response) => {

  const curr_user = await get_user_from_request(request)
  if (!curr_user) return response.status(401).json({ error:'missing or invalid token' })


  const curr_job_id = request.params.id
  const curr_job = await Job.findById(curr_job_id)

  console.log(curr_job)
  const punch_ids = curr_job.punches
  for(let i =0; i<punch_ids.length;i++){
    const p_id = punch_ids[i]
    await Punch.findByIdAndDelete(p_id)
  }

  await Job.findByIdAndDelete(curr_job_id)

  response.status(204).json({ message: 'ok' })
})

module.exports = jobRouter
