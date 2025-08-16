import type { RequestHandler } from 'express';

import query, { transact } from '../db/index.js';
import { IQueryError, isValidUUID } from '../utils.js';

export const addFamily: RequestHandler = async (req, res, next) => {
  try {
    if(!req.body.name || !("description" in req.body)) {
      res.status(400).json({ message: "Please provide all required fields." });
      return;
    }

    const value = await query(
      "INSERT INTO families (name, description) VALUES ($1, $2) RETURNING id",
      [req.body.name, req.body.description]
    );
    res.status(201).json(value.rows[0].id.replaceAll("-", ""));
  } catch(err) {
    if((err as IQueryError).code === '23505') {
      res.status(400).json({ message: `The name '${req.body.name}' is already taken.` });
    } else {
      next(err);
    }
  }
}

export const deleteFamily: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given family ID is not valid." });
    return;
  }

  await transact(async client => {
    const someMember = await client.query(
      `
        SELECT NULL FROM languages
        WHERE family_id = $1
        LIMIT 1
      `,
      [req.params.id]
    );
    if(someMember.rows.length > 0) {
      res.status(400).json({ message: "Cannot delete a non-empty family." });
      return;
    }

    await client.query(
      "DELETE FROM families WHERE id = $1",
      [req.params.id]
    );
  });

  res.status(204).send();
}

export const editFamily: RequestHandler = async (req, res, next) => {
  try {
    if(!isValidUUID(req.params.id)) {
      res.status(400).json({ title: "Invalid ID", message: "The given family ID is not valid." });
      return;
    }
    if(!req.body.name || !('description' in req.body)) {
      res.status(400).json({ message: "Please provide all required fields." });
      return;
    }

    await query(
      `
        UPDATE families
        SET name = $1, description = $2
        WHERE id = $3
      `,
      [req.body.name, req.body.description, req.params.id]
    );

    res.status(204).send();
  } catch(err) {
    if((err as IQueryError).code === '23505') {
      res.status(400).json({ message: `The name '${req.body.name}' is already taken.` });
    } else {
      next(err);
    }
  }
}

export const getAllFamilies: RequestHandler = async (req, res) => {
  const families = await query(
    `
      SELECT
        translate(id::text, '-', '') AS id,
        name, description, created
      FROM families
      ORDER BY name
    `
  );
  res.json(families.rows);
}

export const getFamily: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given family ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT
        translate(id::text, '-', '') AS id,
        name, description, created
      FROM families
      WHERE id = $1
    `,
    [req.params.id]
  );
  if(value.rows.length === 1) {
    res.json(value.rows[0]);
  } else {
    res.status(404).json({ title: "Family not found", message: "The requested family was not found." });
  }
}

export const getFamilyMembers: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given family ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT
        translate(id::text, '-', '') AS id,
        name, autonym,
        translate(parent_id::text, '-', '') AS "parentId",
        status, era, created
      FROM languages
      WHERE family_id = $1
      ORDER BY name
    `,
    [req.params.id]
  );
  res.json(value.rows);
}

export const getLanguageIsolates: RequestHandler = async (req, res) => {
  const value = await query(
    `
      SELECT
        translate(id::text, '-', '') AS id,
        name, autonym,
        translate(parent_id::text, '-', '') AS "parentId",
        status, era, created
      FROM languages
      WHERE family_id IS NULL
      ORDER BY name
    `
  );
  res.json(value.rows);
}
