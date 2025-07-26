import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const ADMIN_USERNAME = "admin"; // Change to your preferred admin name
const ADMIN_PASSWORD_HASH = bcrypt.hashSync("password123", 10); // Change to your password

export async function login(username: string, password: string) {
  if (username !== ADMIN_USERNAME) {
    throw new Error("Invalid username");
  }

  const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!valid) {
    throw new Error("Invalid password");
  }

  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" }
  );

  return token;
}
