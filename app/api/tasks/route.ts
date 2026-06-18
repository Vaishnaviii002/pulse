// import { currentUser } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// async function getAppUser() {
//   const clerkUser = await currentUser();

//   if (!clerkUser) {
//     return {
//       error: NextResponse.json(
//         {
//           success: false,
//           error: "Unauthorized. Please sign in again.",
//         },
//         { status: 401 }
//       ),
//       appUser: null,
//     };
//   }

//   const appUser = await prisma.user.findUnique({
//     where: {
//       clerkId: clerkUser.id,
//     },
//   });

//   if (!appUser) {
//     return {
//       error: NextResponse.json(
//         {
//           success: false,
//           error: "User not synced in database.",
//         },
//         { status: 404 }
//       ),
//       appUser: null,
//     };
//   }

//   return {
//     error: null,
//     appUser,
//   };
// }

// export async function GET() {
//   try {
//     const { error, appUser } = await getAppUser();

//     if (error || !appUser) return error;

//     const tasks = await prisma.task.findMany({
//       where: {
//         userId: appUser.id,
//       },
//       orderBy: [
//         {
//           status: "asc",
//         },
//         {
//           dueAt: "asc",
//         },
//         {
//           createdAt: "desc",
//         },
//       ],
//       take: 200,
//     });

//     return NextResponse.json({
//       success: true,
//       tasks,
//       stats: {
//         total: tasks.length,
//         open: tasks.filter((task) => task.status === "OPEN").length,
//         inProgress: tasks.filter((task) => task.status === "IN_PROGRESS")
//           .length,
//         done: tasks.filter((task) => task.status === "DONE").length,
//         high: tasks.filter((task) => task.priority === "HIGH").length,
//       },
//     });
//   } catch (error) {
//     console.error("TASKS_GET_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : "Failed to load tasks.",
//       },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const { error, appUser } = await getAppUser();

//     if (error || !appUser) return error;

//     const body = await request.json();

//     const title = String(body.title || "").trim();
//     const description = String(body.description || "").trim();
//     const type = String(body.type || "GENERAL").trim();
//     const priority = String(body.priority || "MEDIUM").trim();
//     const dueAtRaw = String(body.dueAt || "").trim();

//     if (!title) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Task title is required.",
//         },
//         { status: 400 }
//       );
//     }

//     const dueAt = dueAtRaw ? new Date(dueAtRaw) : null;

//     const task = await prisma.task.create({
//       data: {
//         userId: appUser.id,
//         title,
//         description,
//         type,
//         priority,
//         status: "OPEN",
//         dueAt:
//           dueAt && !Number.isNaN(dueAt.getTime())
//             ? dueAt
//             : null,
//         source: "MANUAL",
//         metadata: {
//           createdBy: "manual",
//         },
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Task created successfully.",
//       task,
//     });
//   } catch (error) {
//     console.error("TASKS_POST_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : "Failed to create task.",
//       },
//       { status: 500 }
//     );
//   }
// }

// export async function PATCH(request: Request) {
//   try {
//     const { error, appUser } = await getAppUser();

//     if (error || !appUser) return error;

//     const body = await request.json();

//     const taskId = String(body.taskId || "").trim();

//     if (!taskId) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Task id is required.",
//         },
//         { status: 400 }
//       );
//     }

//     const existingTask = await prisma.task.findFirst({
//       where: {
//         id: taskId,
//         userId: appUser.id,
//       },
//     });

//     if (!existingTask) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Task not found.",
//         },
//         { status: 404 }
//       );
//     }

//     const task = await prisma.task.update({
//       where: {
//         id: taskId,
//       },
//       data: {
//         title:
//           typeof body.title === "string" && body.title.trim()
//             ? body.title.trim()
//             : undefined,
//         description:
//           typeof body.description === "string"
//             ? body.description.trim()
//             : undefined,
//         type:
//           typeof body.type === "string" && body.type.trim()
//             ? body.type.trim()
//             : undefined,
//         priority:
//           typeof body.priority === "string" && body.priority.trim()
//             ? body.priority.trim()
//             : undefined,
//         status:
//           typeof body.status === "string" && body.status.trim()
//             ? body.status.trim()
//             : undefined,
//         dueAt:
//           typeof body.dueAt === "string" && body.dueAt.trim()
//             ? new Date(body.dueAt)
//             : body.dueAt === null
//               ? null
//               : undefined,
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Task updated successfully.",
//       task,
//     });
//   } catch (error) {
//     console.error("TASKS_PATCH_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : "Failed to update task.",
//       },
//       { status: 500 }
//     );
//   }
// }




















// import { currentUser } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// async function getAppUser() {
//   const clerkUser = await currentUser();

//   if (!clerkUser) {
//     return {
//       response: NextResponse.json(
//         {
//           success: false,
//           error: "Unauthorized. Please sign in again.",
//         },
//         { status: 401 }
//       ),
//       appUser: null,
//     };
//   }

//   const appUser = await prisma.user.findUnique({
//     where: {
//       clerkId: clerkUser.id,
//     },
//   });

//   if (!appUser) {
//     return {
//       response: NextResponse.json(
//         {
//           success: false,
//           error: "User not synced in database.",
//         },
//         { status: 404 }
//       ),
//       appUser: null,
//     };
//   }

//   return {
//     response: undefined,
//     appUser,
//   };
// }

// export async function GET() {
//   try {
//     const { response, appUser } = await getAppUser();

//     if (response) return response;

//     const tasks = await prisma.task.findMany({
//       where: {
//         userId: appUser.id,
//       },
//       orderBy: [
//         {
//           status: "asc",
//         },
//         {
//           dueAt: "asc",
//         },
//         {
//           createdAt: "desc",
//         },
//       ],
//       take: 200,
//     });

//     return NextResponse.json({
//       success: true,
//       tasks,
//       stats: {
//         total: tasks.length,
//         open: tasks.filter((task) => task.status === "OPEN").length,
//         inProgress: tasks.filter((task) => task.status === "IN_PROGRESS")
//           .length,
//         done: tasks.filter((task) => task.status === "DONE").length,
//         high: tasks.filter((task) => task.priority === "HIGH").length,
//       },
//     });
//   } catch (error) {
//     console.error("TASKS_GET_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : "Failed to load tasks.",
//       },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const { response, appUser } = await getAppUser();

//     if (response) return response;

//     const body = await request.json();

//     const title = String(body.title || "").trim();
//     const description = String(body.description || "").trim();
//     const type = String(body.type || "GENERAL").trim();
//     const priority = String(body.priority || "MEDIUM").trim();
//     const dueAtRaw = String(body.dueAt || "").trim();

//     if (!title) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Task title is required.",
//         },
//         { status: 400 }
//       );
//     }

//     const dueAt = dueAtRaw ? new Date(dueAtRaw) : null;

//     const task = await prisma.task.create({
//       data: {
//         userId: appUser.id,
//         title,
//         description,
//         type,
//         priority,
//         status: "OPEN",
//         dueAt:
//           dueAt && !Number.isNaN(dueAt.getTime())
//             ? dueAt
//             : null,
//         source: "MANUAL",
//         metadata: {
//           createdBy: "manual",
//         },
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Task created successfully.",
//       task,
//     });
//   } catch (error) {
//     console.error("TASKS_POST_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : "Failed to create task.",
//       },
//       { status: 500 }
//     );
//   }
// }

// export async function PATCH(request: Request) {
//   try {
//     const { response, appUser } = await getAppUser();

//     if (response) return response;

//     const body = await request.json();

//     const taskId = String(body.taskId || "").trim();

//     if (!taskId) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Task id is required.",
//         },
//         { status: 400 }
//       );
//     }

//     const existingTask = await prisma.task.findFirst({
//       where: {
//         id: taskId,
//         userId: appUser.id,
//       },
//     });

//     if (!existingTask) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Task not found.",
//         },
//         { status: 404 }
//       );
//     }

//     const task = await prisma.task.update({
//       where: {
//         id: taskId,
//       },
//       data: {
//         title:
//           typeof body.title === "string" && body.title.trim()
//             ? body.title.trim()
//             : undefined,
//         description:
//           typeof body.description === "string"
//             ? body.description.trim()
//             : undefined,
//         type:
//           typeof body.type === "string" && body.type.trim()
//             ? body.type.trim()
//             : undefined,
//         priority:
//           typeof body.priority === "string" && body.priority.trim()
//             ? body.priority.trim()
//             : undefined,
//         status:
//           typeof body.status === "string" && body.status.trim()
//             ? body.status.trim()
//             : undefined,
//         dueAt:
//           typeof body.dueAt === "string" && body.dueAt.trim()
//             ? new Date(body.dueAt)
//             : body.dueAt === null
//               ? null
//               : undefined,
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Task updated successfully.",
//       task,
//     });
//   } catch (error) {
//     console.error("TASKS_PATCH_ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : "Failed to update task.",
//       },
//       { status: 500 }
//     );
//   }
// }














import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TaskItem = {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  type: string;
  priority: string;
  status: string;
  dueAt?: Date | null;
  source?: string | null;
  metadata?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};

async function getAppUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please sign in again.",
        },
        { status: 401 },
      ),
      appUser: null,
    };
  }

  const appUser = await prisma.user.findUnique({
    where: {
      clerkId: clerkUser.id,
    },
  });

  if (!appUser) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "User not synced in database.",
        },
        { status: 404 },
      ),
      appUser: null,
    };
  }

  return {
    response: null,
    appUser,
  };
}

export async function GET() {
  try {
    const { response, appUser } = await getAppUser();

    if (response) return response;

    if (!appUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found.",
        },
        { status: 404 },
      );
    }

    const tasks = (await prisma.task.findMany({
      where: {
        userId: appUser.id,
      },
      orderBy: [
        {
          status: "asc",
        },
        {
          dueAt: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 200,
    })) as TaskItem[];

    return NextResponse.json({
      success: true,
      tasks,
      stats: {
        total: tasks.length,
        open: tasks.filter((task: TaskItem) => task.status === "OPEN").length,
        inProgress: tasks.filter(
          (task: TaskItem) => task.status === "IN_PROGRESS",
        ).length,
        done: tasks.filter((task: TaskItem) => task.status === "DONE").length,
        high: tasks.filter((task: TaskItem) => task.priority === "HIGH").length,
      },
    });
  } catch (error) {
    console.error("TASKS_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load tasks.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { response, appUser } = await getAppUser();

    if (response) return response;

    if (!appUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found.",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const type = String(body.type || "GENERAL").trim();
    const priority = String(body.priority || "MEDIUM").trim();
    const dueAtRaw = String(body.dueAt || "").trim();

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Task title is required.",
        },
        { status: 400 },
      );
    }

    const parsedDueAt = dueAtRaw ? new Date(dueAtRaw) : null;
    const dueAt =
      parsedDueAt && !Number.isNaN(parsedDueAt.getTime())
        ? parsedDueAt
        : null;

    const task = await prisma.task.create({
      data: {
        userId: appUser.id,
        title,
        description,
        type,
        priority,
        status: "OPEN",
        dueAt,
        source: "MANUAL",
        metadata: {
          createdBy: "manual",
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Task created successfully.",
      task,
    });
  } catch (error) {
    console.error("TASKS_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create task.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { response, appUser } = await getAppUser();

    if (response) return response;

    if (!appUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found.",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const taskId = String(body.taskId || "").trim();

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          error: "Task id is required.",
        },
        { status: 400 },
      );
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: appUser.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: "Task not found.",
        },
        { status: 404 },
      );
    }

    const parsedDueAt =
      typeof body.dueAt === "string" && body.dueAt.trim()
        ? new Date(body.dueAt)
        : null;

    const task = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        title:
          typeof body.title === "string" && body.title.trim()
            ? body.title.trim()
            : undefined,
        description:
          typeof body.description === "string"
            ? body.description.trim()
            : undefined,
        type:
          typeof body.type === "string" && body.type.trim()
            ? body.type.trim()
            : undefined,
        priority:
          typeof body.priority === "string" && body.priority.trim()
            ? body.priority.trim()
            : undefined,
        status:
          typeof body.status === "string" && body.status.trim()
            ? body.status.trim()
            : undefined,
        dueAt:
          typeof body.dueAt === "string" && body.dueAt.trim()
            ? parsedDueAt && !Number.isNaN(parsedDueAt.getTime())
              ? parsedDueAt
              : undefined
            : body.dueAt === null
              ? null
              : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Task updated successfully.",
      task,
    });
  } catch (error) {
    console.error("TASKS_PATCH_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update task.",
      },
      { status: 500 },
    );
  }
}