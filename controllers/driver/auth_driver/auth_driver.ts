import { Request, Response } from "express";
import { generaJWT } from "../../../helpers/genera-jwt";
import { Passenger } from "../../../models/models";
const pool = require("../../../mysql/database");

export const authCredentialsDriver = async (req: Request, res: Response) => {
  const { correo, clave } = req.body;
  try {
    const claveEncrypted = await pool.query(
      `SELECT clave, id_cuenta FROM cuenta WHERE correo = '${correo}';`
    );

    if (claveEncrypted.length > 0) {
      try {
        const query = await pool.query(
          `CALL VERIFY_DRIVER(
            '${correo}',
            '${claveEncrypted[0].id_cuenta}'
          );`
        );

        console.log(query);
        if (query.length > 0) {
          const user = query[0][0] as Passenger;
          try {
            const token = await generaJWT(user);
            if (user) {
              res.status(200).json({
                user,
                token,
                code: "200"
              });
            } else {
              res.status(400).json({
                user: {},
                token: "",
                code: "400",
              });
            }
          } catch (jwtError) {
            console.error('Error generating JWT:', jwtError as Error);
            res.status(500).json({
              user: {},
              token: "",
              code: "500",
              error: "Error generating token"
            });
          }
        } else {
          res.status(400).json({
            user: {},
            token: "",
            code: "400",
          });
        }
      } catch (queryError) {
        console.error('Error calling VERIFY_DRIVER procedure:', queryError as Error);
        res.status(500).json({
          user: {},
          token: "",
          code: "500",
          error: "Database procedure error"
        });
      }
    } else {
      res.status(400).json({
        user: {},
        token: "",
        code: "400",
      });
    }
  } catch (dbError) {
    console.error('Error querying the database:', dbError as Error);
    res.status(500).json({
      user: {},
      token: "",
      code: "500",
      error: "Database query error"
    });
  }
};
