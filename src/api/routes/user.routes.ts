import { Router } from "express";
import { listUsers, getUserById } from "../controllers/user.controller";
import { postDescriptionFixer } from "../../controllers/user.controller";
// Se eliminó la importación de health.routes que no existía y causaba error
const routerUser = Router();

routerUser.get("/users", listUsers);
routerUser.get("/:id", getUserById); 
routerUser.post('/:id/description', postDescriptionFixer);

export default routerUser;
