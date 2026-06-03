// === Solver Engine ===
// Численные методы для решения систем уравнений

/**
 * Newton-Raphson solver для систем уравнений
 */
export class NewtonRaphson {
  private maxIter: number;
  private tol: number;

  constructor(maxIter: number = 100, tol: number = 1e-8) {
    this.maxIter = maxIter;
    this.tol = tol;
  }

  /**
   * Решение системы нелинейных уравнений
   * @param F - векторная функция, возвращающая массив остатков
   * @param x0 - начальное приближение
   * @param n - размерность системы
   */
  solve(
    F: (x: number[]) => number[],
    x0: number[],
    n: number
  ): { x: number[]; iterations: number; converged: boolean } {
    let x = [...x0];
    let converged = false;
    let iterations = 0;

    for (iterations = 0; iterations < this.maxIter; iterations++) {
      const Fx = F(x);

      // Проверка сходимости
      const norm = Math.sqrt(Fx.reduce((sum, f) => sum + f * f, 0));
      if (norm < this.tol) {
        converged = true;
        break;
      }

      // Численный Jacobian
      const J = this.jacobian(F, x, n);

      // Решение J * dx = -F
      const dx = this.solveLinear(J, Fx, n);

      // Обновление
      for (let i = 0; i < n; i++) {
        x[i] += dx[i];
      }
    }

    return { x, iterations, converged };
  }

  /**
   * Вычисление Jacobian численно
   */
  private jacobian(
    F: (x: number[]) => number[],
    x: number[],
    n: number
  ): number[][] {
    const eps = 1e-6;
    const J: number[][] = [];

    const Fx = F(x);

    for (let i = 0; i < n; i++) {
      const x_plus = [...x];
      x_plus[i] += eps;

      const Fx_plus = F(x_plus);

      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        row.push((Fx_plus[j] - Fx[j]) / eps);
      }
      J.push(row);
    }

    return J;
  }

  /**
   * Решение системы линейных уравнений методом Гаусса
   */
  private solveLinear(A: number[][], b: number[], n: number): number[] {
    // Прямой ход
    const A_aug = A.map((row, i) => [...row, b[i]]);

    for (let i = 0; i < n; i++) {
      // Поиск главного элемента
      let maxRow = i;
      let maxVal = Math.abs(A_aug[i][i]);

      for (let k = i + 1; k < n; k++) {
        if (Math.abs(A_aug[k][i]) > maxVal) {
          maxVal = Math.abs(A_aug[k][i]);
          maxRow = k;
        }
      }

      // Перестановка строк
      [A_aug[i], A_aug[maxRow]] = [A_aug[maxRow], A_aug[i]];

      // Исключение
      for (let k = i + 1; k < n; k++) {
        const factor = A_aug[k][i] / A_aug[i][i];
        for (let j = i; j <= n; j++) {
          A_aug[k][j] -= factor * A_aug[i][j];
        }
      }
    }

    // Обратный ход
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < n; j++) {
        sum += A_aug[i][j] * x[j];
      }
      x[i] = (A_aug[i][n] - sum) / A_aug[i][i];
    }

    return x;
  }
}

/**
 * Wegstein method для ускорения сходимости
 */
export class Wegstein {
  private maxIter: number;
  private tol: number;

  constructor(maxIter: number = 100, tol: number = 1e-6) {
    this.maxIter = maxIter;
    this.tol = tol;
  }

  /**
   * Решение одноугольного уравнения x = g(x)
   */
  solve(
    g: (x: number) => number,
    x0: number
  ): { x: number; iterations: number; converged: boolean } {
    let x = x0;
    let x_prev = x0;
    let converged = false;
    let iterations = 0;

    let q = 0; // slope approximation

    for (iterations = 0; iterations < this.maxIter; iterations++) {
      let x_new = g(x);

      if (Math.abs(x_new - x) < this.tol) {
        converged = true;
        break;
      }

      // Wegstein formula
      if (iterations > 0 && Math.abs(q) > 1e-10) {
        x_new = x + (x - x_prev) / q * (x_new - x);
      }

      if (iterations > 0) {
        const delta_x = x - x_prev;
        const delta_g = x_new - x;
        if (Math.abs(delta_x) > 1e-10) {
          q = delta_g / delta_x;
        }
      }

      x_prev = x;
      x = x_new;
    }

    return { x, iterations, converged };
  }
}

/**
 * Aitken delta-squared acceleration
 */
export class Aitken {
  private maxIter: number;
  private tol: number;

  constructor(maxIter: number = 100, tol: number = 1e-8) {
    this.maxIter = maxIter;
    this.tol = tol;
  }

  solve(
    g: (x: number) => number,
    x0: number
  ): { x: number; iterations: number; converged: boolean } {
    let x = x0;
    let converged = false;
    let iterations = 0;

    for (iterations = 0; iterations < this.maxIter; iterations++) {
      const x1 = g(x);
      const x2 = g(x1);

      // Aitken's delta-squared
      const delta = x2 - 2 * x1 + x;
      if (Math.abs(delta) > 1e-10) {
        x = x - ((x1 - x) * (x1 - x)) / delta;
      } else {
        x = x2;
      }

      if (Math.abs(g(x) - x) < this.tol) {
        converged = true;
        break;
      }
    }

    return { x, iterations, converged };
  }
}

/**
 * MESH solver для дистилляционной колонны
 * MESH = Mass, Energy, Equilibrium, Stream balances
 */
export class MeshSolver {
  private maxIter: number;
  private tol: number;

  constructor(maxIter: number = 200, tol: number = 1e-6) {
    this.maxIter = maxIter;
    this.tol = tol;
  }

  /**
   * Решение MESH для колонны
   */
  solve(
    nStages: number,
    feedStage: number,
    refluxRatio: number,
    boilupRatio: number,
    feedFlow: number,
    feedComposition: Map<string, number>,
    feedPhase: 'liquid' | 'vapor',
    pressureDrop: number // bar per stage
  ): {
    temperatures: number[];
    liquidFlows: number[]; // kmol/h
    vaporFlows: number[]; // kmol/h
    compositions: Map<string, number[]>; // component -> [x1, x2, ...]
    converged: boolean;
  } {
    // Инициализация
    const temps = new Array(nStages).fill(350); // K
    const L = new Array(nStages).fill(feedFlow); // liquid flow
    const V = new Array(nStages).fill(feedFlow * 0.8); // vapor flow
    const x = new Map<string, number[]>();

    // Инициализация составов
    const compIds = Array.from(feedComposition.keys());
    for (const id of compIds) {
      x.set(id, new Array(nStages).fill(feedComposition.get(id) || 0));
    }

    let converged = false;
    let iterations = 0;

    for (iterations = 0; iterations < this.maxIter; iterations++) {
      // 1. Equilibrium (K-values)
      const K = new Map<string, number[]>();
      for (const id of compIds) {
        K.set(id, temps.map((T) => this.kValue(T, id)));
      }

      // 2. Mass balance (rectifying section)
      for (let i = 0; i < feedStage; i++) {
        if (i === 0) {
          // Top of column
          const D = feedFlow * 0.5; // distillate flow (примерно)
          L[i] = refluxRatio * D + V[i + 1] - L[i + 1];
        } else {
          L[i] = L[i - 1] + V[i + 1] - L[i + 1];
        }
      }

      // 3. Energy balance (упрощённо)
      for (let i = 0; i < nStages; i++) {
        const Q_reboiler = feedFlow * 50; // heat input
        if (i === feedStage) {
          temps[i] += Q_reboiler / (L[i] * 2.0); // cp ≈ 2 kJ/(mol·K)
        }
      }

      // 4. Convergence check
      const maxResidual = this.checkConvergence(L, V, x, feedComposition);
      if (maxResidual < this.tol) {
        converged = true;
        break;
      }

      // 5. Update compositions (Rachford-Rice)
      for (const id of compIds) {
        for (let i = 0; i < nStages; i++) {
          const K_i = K.get(id)?.[i] || 1;
          const z = feedComposition.get(id) || 0;
          let VoverF = 0.5; // initial guess

          // Simple iteration
          for (let j = 0; j < 10; j++) {
            const denom = 1 + VoverF * (K_i - 1);
            const x_i = z / denom;
            const y_i = K_i * x_i;

            const newVF = (y_i - x_i) / (K_i - 1);
            if (newVF >= 0 && newVF <= 1) {
              VoverF = newVF;
            }
          }

          x.get(id)![i] = z / (1 + VoverF * (K_i - 1));
        }
      }
    }

    return {
      temperatures: temps,
      liquidFlows: L,
      vaporFlows: V,
      compositions: x,
      converged,
    };
  }

  /**
   * K-value correlation
   */
  private kValue(T: number, componentId: string): number {
    // Упрощённая корреляция
    // K = exp(5 - T/100) для лёгких компонентов
    // K = exp(10 - T/50) для тяжёлых компонентов

    if (componentId === 'CH4' || componentId === 'H2') {
      return Math.exp(5 - T / 100);
    } else if (componentId === 'HGO' || componentId === 'COKE') {
      return Math.exp(10 - T / 50);
    } else {
      return Math.exp(7 - T / 70);
    }
  }

  /**
   * Проверка сходимости
   */
  private checkConvergence(
    L: number[],
    V: number[],
    x: Map<string, number[]>,
    feedComposition: Map<string, number>
  ): number {
    let maxResidual = 0;

    // Check mass balance
    const compIds = Array.from(feedComposition.keys());
    for (const id of compIds) {
      const xs = x.get(id) || [];
      for (let i = 0; i < xs.length - 1; i++) {
        const residual = Math.abs(xs[i] - xs[i + 1]);
        if (residual > maxResidual) maxResidual = residual;
      }
    }

    return maxResidual;
  }
}
