import express from "express";
import cors from "cors";
import { Role, Status, PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcrypt";
import { createUserSchema, signinSchema } from "./zod";
import jwt from "jsonwebtoken";
import middleware from "./middleware";
import { success } from "zod";

const app = express();
app.use(cors());
app.use(express.json());
const prisma = new PrismaClient();

app.post("/signup", async (req, res) => {
  const parsedData = createUserSchema.safeParse(req.body);

  if (!parsedData.success) {
    return res.status(401).json({
      message: "wrong inputs",
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      username: parsedData.data.username,
    },
  });

  if (existingUser) {
    return res.json({
      message: "User already exists",
      Status: 409,
    });
  }

  const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name: parsedData.data.name,
        username: parsedData.data.username,
        password: hashedPassword,
        role: parsedData.data.role,
      },
    });

    res.status(201).json({
      user: user,
      message: "user created",
    });
    return;
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "something went wrong",
    });
  }
});

app.post("/signin", async (req, res) => {
  const parsedData = signinSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.json({ message: "wrong Inputs" }).status(401);
  }

  const user = await prisma.user.findFirst({
    where: {
      username: parsedData.data?.username,
    },
  });
  if (!user) {
    return res.status(403).json({ message: "No User exists" });
  }

  const correctPassword = bcrypt.compare(
    parsedData.data.password,
    user.password
  );
  if (!correctPassword) {
    return res.status(403).json({ message: "wrong password" });
  }

  const token = jwt.sign(
    { userId: user.id, name: user.name },
    process.env.JWT_SECRET!
  );
  res.status(200).json({
    token,
    message: "signin successful",
  });
});

app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "Published",
        is_deleted: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      count: products.length,
      data: products,
    });
  } catch (error) {}
});

app.get("/allProducts", middleware, async(req,res) => {
  try {
    const products = await prisma.product.findMany()
  return res.status(200).json({
    success:true,
    message: "products fetched successfully",
    data: products
  })
  } catch (error) {
    return res.status(500).json({message: "internal server error"})
    
  }
  
})

app.post("/product", middleware, async (req, res) => {
  const { name, desc, status } = req.body;
  const userId = req.userId;
  try {
    if (!name || !desc) {
      return res
        .status(400)
        .json({ success: false, message: "Name and description are required" });
    }
    const product = await prisma.product.create({
      data: {
        name,
        desc,
        status,
        created_by: userId,
        updated_by: userId,
      },
    });
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

app.put("/product/:id", middleware, async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.role !== "Admin" && product.created_by !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this product" });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...req.body,
        updated_by: userId,
      },
    });

    return res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/product/:id", middleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.role !== "Admin" && product.created_by !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this product" });
    }

    const deletedProduct = await prisma.product.update({
      where: { id },
      data: {
        is_deleted: true,
        updated_by: userId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: deletedProduct,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

app.listen(8000, () => {
  console.log("server started on port 8000");
});
