/**
 * Simple libconfig parser for logiops configuration files
 * Handles the standard libconfig format where : and = are interchangeable
 */

export interface LibconfigValue {
  [key: string]: any;
}

/**
 * Parse libconfig format content into a JavaScript object
 */
export function parseLibconfig(content: string): LibconfigValue {
  const tokens = tokenize(content);

  // If the first token is an identifier, treat the whole thing as an object
  if (tokens.length > 0 && tokens[0].type === 'identifier') {
    const result = parseObject(tokens, 0);
    return result.value as LibconfigValue;
  } else {
    const result = parseValue(tokens, 0);
    return result.value as LibconfigValue;
  }
}

interface Token {
  type: 'identifier' | 'string' | 'number' | 'boolean' | 'operator' | 'delimiter' | 'comment';
  value: string;
  line: number;
  column: number;
}

/**
 * Tokenize the libconfig content
 */
function tokenize(content: string): Token[] {
  const tokens: Token[] = [];
  const lines = content.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    let column = 0;

    while (column < line.length) {
      const char = line[column];

      // Skip whitespace
      if (/\s/.test(char)) {
        column++;
        continue;
      }

      // Comments
      if (char === '/' && line[column + 1] === '/') {
        break; // Skip rest of line
      }
      if (char === '#') {
        break; // Skip rest of line
      }

      // String literals
      if (char === '"') {
        const start = column;
        column++; // Skip opening quote
        let value = '';

        while (column < line.length && line[column] !== '"') {
          if (line[column] === '\\' && column + 1 < line.length) {
            // Handle escape sequences
            column++;
            const escaped = line[column];
            switch (escaped) {
              case 'n': value += '\n'; break;
              case 't': value += '\t'; break;
              case 'r': value += '\r'; break;
              case '\\': value += '\\'; break;
              case '"': value += '"'; break;
              default: value += escaped; break;
            }
          } else {
            value += line[column];
          }
          column++;
        }

        if (column < line.length) column++; // Skip closing quote

        tokens.push({
          type: 'string',
          value,
          line: lineNum + 1,
          column: start + 1
        });
        continue;
      }

      // Numbers (including hex)
      if (/\d/.test(char) || (char === '0' && line[column + 1] === 'x')) {
        const start = column;
        let value = '';

        if (char === '0' && line[column + 1] === 'x') {
          // Hex number
          value += line[column++]; // 0
          value += line[column++]; // x
          while (column < line.length && /[0-9a-fA-F]/.test(line[column])) {
            value += line[column++];
          }
        } else {
          // Decimal number
          while (column < line.length && /[\d\.]/.test(line[column])) {
            value += line[column++];
          }
        }

        tokens.push({
          type: 'number',
          value,
          line: lineNum + 1,
          column: start + 1
        });
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(char)) {
        const start = column;
        let value = '';

        while (column < line.length && /[a-zA-Z0-9_]/.test(line[column])) {
          value += line[column++];
        }

        // Check for boolean keywords
        if (value === 'true' || value === 'false') {
          tokens.push({
            type: 'boolean',
            value,
            line: lineNum + 1,
            column: start + 1
          });
        } else {
          tokens.push({
            type: 'identifier',
            value,
            line: lineNum + 1,
            column: start + 1
          });
        }
        continue;
      }

      // Operators and delimiters
      if ('=:;,{}()'.includes(char)) {
        tokens.push({
          type: char === '=' || char === ':' ? 'operator' : 'delimiter',
          value: char,
          line: lineNum + 1,
          column: column + 1
        });
        column++;
        continue;
      }

      // Unknown character, skip it
      column++;
    }
  }

  return tokens;
}

/**
 * Parse a value from tokens starting at the given index
 */
function parseValue(tokens: Token[], index: number): { value: any; nextIndex: number } {
  if (index >= tokens.length) {
    throw new Error('Unexpected end of input');
  }

  const token = tokens[index];

  switch (token.type) {
    case 'string':
      return { value: token.value, nextIndex: index + 1 };

    case 'number':
      const numValue = token.value.startsWith('0x')
        ? token.value  // Keep hex as string for now
        : parseFloat(token.value);
      return { value: numValue, nextIndex: index + 1 };

    case 'boolean':
      return { value: token.value === 'true', nextIndex: index + 1 };

    case 'delimiter':
      if (token.value === '{') {
        // Parse object
        return parseObject(tokens, index + 1);
      } else if (token.value === '(') {
        // Parse array
        return parseArray(tokens, index + 1);
      }
      break;
  }

  throw new Error(`Unexpected token: ${token.value} at line ${token.line}`);
}

/**
 * Parse an object from tokens
 */
function parseObject(tokens: Token[], index: number): { value: any; nextIndex: number } {
  const obj: any = {};

  while (index < tokens.length) {
    const token = tokens[index];

    if (token.type === 'delimiter' && token.value === '}') {
      return { value: obj, nextIndex: index + 1 };
    }

    if (token.type === 'identifier') {
      const key = token.value;
      index++;

      // Expect : or =
      if (index >= tokens.length ||
        (tokens[index].type !== 'operator' ||
          (tokens[index].value !== ':' && tokens[index].value !== '='))) {
        throw new Error(`Expected : or = after ${key} at line ${token.line}`);
      }
      index++; // Skip operator

      // Parse value
      const result = parseValue(tokens, index);
      obj[key] = result.value;
      index = result.nextIndex;

      // Skip optional semicolon or comma
      if (index < tokens.length &&
        tokens[index].type === 'delimiter' &&
        (tokens[index].value === ';' || tokens[index].value === ',')) {
        index++;
      }
    } else {
      index++;
    }
  }

  return { value: obj, nextIndex: index };
}

/**
 * Parse an array from tokens
 */
function parseArray(tokens: Token[], index: number): { value: any; nextIndex: number } {
  const arr: any[] = [];

  while (index < tokens.length) {
    const token = tokens[index];

    if (token.type === 'delimiter' && token.value === ')') {
      return { value: arr, nextIndex: index + 1 };
    }

    // Parse array element
    const result = parseValue(tokens, index);
    arr.push(result.value);
    index = result.nextIndex;

    // Skip optional comma
    if (index < tokens.length &&
      tokens[index].type === 'delimiter' &&
      tokens[index].value === ',') {
      index++;
    }
  }

  throw new Error('Unterminated array');
}