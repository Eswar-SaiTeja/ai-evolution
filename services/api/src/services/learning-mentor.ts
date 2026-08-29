import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LessonTopic {
  title: string;
  description: string;
  example: string;
  exercise: string;
  quiz: {
    question: string;
    options: string[];
    answer: number; // index of correct option
  }[];
}

export class LearningMentorService {
  static async createCourse(userId: string, title: string, level: string) {
    // Standard course roadmaps based on standard topics
    const roadmap = this.generateRoadmapForTopic(title, level);

    const course = await prisma.learningCourse.create({
      data: {
        userId,
        title,
        subject: title,
        level,
        roadmap: JSON.stringify(roadmap),
        currentTopicIndex: 0
      }
    });

    // Populate the first topic's progress with quiz & flashcard outlines
    for (let i = 0; i < roadmap.length; i++) {
      const topic = roadmap[i];
      const flashcards = this.generateFlashcardsForTopic(topic.title);

      await prisma.learningProgress.create({
        data: {
          courseId: course.id,
          topicName: topic.title,
          isCompleted: false,
          flashcards: JSON.stringify(flashcards)
        }
      });
    }

    return course;
  }

  private static generateRoadmapForTopic(title: string, level: string): LessonTopic[] {
    const lower = title.toLowerCase();

    if (lower.includes('python')) {
      return [
        {
          title: 'Syntax and Variables',
          description: 'Python uses dynamic typing and indentation for code blocks. Variables are declared by simple assignment.',
          example: 'x = 5\nname = "Python"\nprint(f"{name} version {x}")',
          exercise: 'Create a variable named "mentor" and assign it the string "K.A.R.E.N.". Then print it.',
          quiz: [
            {
              question: 'Which of the following is a valid variable name in Python?',
              options: ['2key_value', 'key-value', 'key_value', 'key value'],
              answer: 2
            },
            {
              question: 'How do you denote code blocks in Python?',
              options: ['Curly braces {}', 'Keywords begin/end', 'Indentation/whitespace', 'Parentheses ()'],
              answer: 2
            }
          ]
        },
        {
          title: 'Control Structures',
          description: 'Control flow in Python is managed using if, elif, and else statements, alongside for and while loops.',
          example: 'if x > 3:\n    print("Greater")\nelse:\n    print("Smaller")',
          exercise: 'Write a loop that prints numbers from 1 to 5.',
          quiz: [
            {
              question: 'What is the correct keyword for "else if" in Python?',
              options: ['elseif', 'elif', 'else if', 'elsif'],
              answer: 1
            }
          ]
        },
        {
          title: 'Functions & Modules',
          description: 'Functions are defined using the "def" keyword. You can import built-in libraries using "import".',
          example: 'def greet(name):\n    return f"Hello {name}"\n\nimport math\nprint(math.sqrt(16))',
          exercise: 'Write a function named "square" that accepts a number and returns its squared value.',
          quiz: [
            {
              question: 'Which keyword starts a function definition in Python?',
              options: ['func', 'def', 'function', 'define'],
              answer: 1
            }
          ]
        }
      ];
    }

    // Default roadmap
    return [
      {
        title: 'Core Fundamentals',
        description: `Introduction to the primary concepts of ${title} at the ${level} tier.`,
        example: '// Standard initialization and structure definitions.',
        exercise: 'Implement a basic instance setup and display the operational logs.',
        quiz: [
          {
            question: `What is the primary design pattern of ${title}?`,
            options: ['Decoupled functional structures', 'Monolithic variables', 'Object orientation', 'Asynchronous queues'],
            answer: 0
          }
        ]
      },
      {
        title: 'Intermediate Concepts',
        description: 'Advanced bindings, exception handlings, and asynchronous data layers.',
        example: '// Async data pipelines.',
        exercise: 'Set up a safe connection failover handler.',
        quiz: [
          {
            question: 'How do you handle runtime errors cleanly?',
            options: ['Ignoration', 'Try-Catch enclosures', 'Process termination', 'Memory wipes'],
            answer: 1
          }
        ]
      }
    ];
  }

  private static generateFlashcardsForTopic(topicTitle: string) {
    return [
      { front: `What is the core purpose of "${topicTitle}"?`, back: 'It establishes the basic structural guidelines for compiling logic.', status: 'NEW' },
      { front: `Mention a common mistake in "${topicTitle}"?`, back: 'Forgetting syntax boundaries or improper indentation parameters.', status: 'NEW' }
    ];
  }

  static async submitQuizScore(progressId: string, score: number) {
    return prisma.learningProgress.update({
      where: { id: progressId },
      data: {
        quizScore: score,
        isCompleted: true
      }
    });
  }

  static async getCourseDetails(courseId: string) {
    const course = await prisma.learningCourse.findUnique({
      where: { id: courseId },
      include: { progress: true }
    });

    if (!course) return null;

    return {
      ...course,
      roadmap: JSON.parse(course.roadmap)
    };
  }
}
