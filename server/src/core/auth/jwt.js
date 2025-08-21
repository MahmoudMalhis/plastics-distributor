import jwt from "jsonwebtoken";

export function signAccess(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      distributorId: user.distributor_id ?? null,
      active: user.active,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "1h" }
  );
}

export function signRefresh(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyAccess(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

export function verifyRefresh(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}
