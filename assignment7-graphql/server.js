import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { GraphQLError } from 'graphql';
import { query, testConnection } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read schema.graphql
const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

// Define resolvers backed by MySQL queries
const resolvers = {
  Query: {
    dishes: async () => {
      try {
        const rows = await query('SELECT id, name, price, available FROM dishes ORDER BY id ASC');
        return rows.map((row) => ({
          id: String(row.id),
          name: row.name,
          price: parseFloat(row.price),
          available: Boolean(row.available),
        }));
      } catch (err) {
        console.error('Error in dishes query resolver:', err.message);
        throw new GraphQLError('Failed to fetch dishes from database.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    dish: async (_, { id }) => {
      try {
        const rows = await query('SELECT id, name, price, available FROM dishes WHERE id = ?', [id]);
        if (!rows || rows.length === 0) {
          return null;
        }
        const row = rows[0];
        return {
          id: String(row.id),
          name: row.name,
          price: parseFloat(row.price),
          available: Boolean(row.available),
        };
      } catch (err) {
        console.error(`Error in dish(${id}) query resolver:`, err.message);
        throw new GraphQLError(`Failed to fetch dish with ID ${id}.`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  Mutation: {
    addDish: async (_, { input }) => {
      const { name, price, available } = input;

      // Validate inputs
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new GraphQLError('Dish name is required and cannot be empty.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        throw new GraphQLError('Valid non-negative price is required.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Default available to true if omitted
      const isAvailable = available !== undefined && available !== null ? Boolean(available) : true;

      try {
        // Parameterized INSERT statement
        const result = await query(
          'INSERT INTO dishes (name, price, available) VALUES (?, ?, ?)',
          [name.trim(), parsedPrice, isAvailable]
        );

        const newId = result.insertId;

        // Retrieve real inserted record from database
        const rows = await query('SELECT id, name, price, available FROM dishes WHERE id = ?', [newId]);
        if (!rows || rows.length === 0) {
          throw new GraphQLError('Dish was created but could not be retrieved from MySQL.', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          });
        }

        const inserted = rows[0];
        return {
          id: String(inserted.id),
          name: inserted.name,
          price: parseFloat(inserted.price),
          available: Boolean(inserted.available),
        };
      } catch (err) {
        console.error('Error in addDish mutation resolver:', err.message);
        if (err instanceof GraphQLError) throw err;
        throw new GraphQLError('Failed to insert new dish into database.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
};

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Initialize Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Mount Apollo Server at /graphql
  app.use('/graphql', expressMiddleware(server));

  // Serve static HTML/CSS frontend from public directory
  app.use(express.static(path.join(__dirname, 'public')));

  // Test database connection before listening
  try {
    await testConnection();
    console.log('✅ Connected to MySQL database successfully.');
  } catch (dbErr) {
    console.warn('⚠️ Database connection warning:', dbErr.message);
    console.warn('   Ensure MySQL is running and schema.sql has been executed.');
  }

  const PORT = process.env.PORT || 4000;

  httpServer.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 CampusEats GraphQL Service is running!`);
    console.log(`🌐 Frontend Application: http://localhost:${PORT}/`);
    console.log(`📊 GraphQL Endpoint:     http://localhost:${PORT}/graphql`);
    console.log(`======================================================\n`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
