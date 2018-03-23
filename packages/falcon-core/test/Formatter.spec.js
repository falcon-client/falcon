// @flow
import SqliteFormatter from '../src/formatters/SqliteFormatter';

const tabbedKeywords = [
  'AND',
  'BETWEEN',
  'CASE',
  'ELSE',
  'END',
  'ON',
  'OR',
  'OVER',
  'WHEN'
];

const untabbedKeywords = [
  'FROM',
  'GROUP BY',
  'HAVING',
  'JOIN',
  'CROSS JOIN',
  'INNER JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'ORDER BY',
  'WHERE',
  'WITH',
  'SET'
];

const unchangedKeywords = [
  'IN',
  'ALL',
  'AS',
  'ASC',
  'DESC',
  'DISTINCT',
  'EXISTS',
  'NOT',
  'NULL',
  'LIKE'
];

describe('Formatters', () => {
  const numSpaces = 2;
  const tab = ' '.repeat(numSpaces);

  it('should format basic sqlite statement', () => {
    expect(SqliteFormatter('SELECT * FROM users')).toEqual(
      'SELECT *\nFROM users'
    );
  });

  it('formatting a full SELECT query', () => {
    expect(
      SqliteFormatter(
        'SELECT a.b, c.d FROM a JOIN b on a.b = c.d WHERE a.b = 1 AND c.d = 1',
        numSpaces
      )
    ).toEqual(
      `SELECT a.b,\n${tab}${tab}c.d\nFROM a\nJOIN b\n${tab}ON a.b = c.d\nWHERE a.b = 1\n${tab}AND c.d = 1`
    );
  });

  it('formatting a full UPDATE query', () => {
    expect(
      SqliteFormatter('UPDATE a SET a.b = 1, a.c = 2 WHERE a.d = 3', numSpaces)
    ).toEqual(`UPDATE a\nSET a.b = 1,\n${tab}${tab}a.c = 2\nWHERE a.d = 3`);
  });

  it('formatting a full DELETE query', () => {
    expect(
      SqliteFormatter('DELETE FROM a WHERE a.b = 1 AND a.c = 2', numSpaces)
    ).toEqual(`DELETE\nFROM a\nWHERE a.b = 1\n${tab}AND a.c = 2`);
  });

  describe('SqliteFormatter', () => {
    describe('formatting of tabbed keywords', () => {
      tabbedKeywords.forEach(word => {
        it(`formatting of '${word}'`, () => {
          expect(SqliteFormatter(`foo ${word} bar`, 2)).toEqual(
            `foo\n  ${word} bar`
          );
        });
      });
    });

    describe('formatting of untabbed keywords', () => {
      untabbedKeywords.forEach(word => {
        it(`formatting of '${word}'`, () => {
          expect(SqliteFormatter(`foo ${word} bar`, 2)).toEqual(
            `foo\n${word} bar`
          );
        });
      });
    });

    describe('formatting of unchanged keywords', () => {
      unchangedKeywords.forEach(word => {
        it(`formatting of '${word}'`, () => {
          expect(SqliteFormatter(`foo ${word} bar`, 2)).toEqual(
            `foo ${word} bar`
          );
        });
      });
    });

    describe('SELECTs', () => {
      it("formatting of 'SELECT'", () => {
        expect(SqliteFormatter('SELECT foo bar', 2)).toEqual('SELECT foo bar');
      });
      it("formatting of ' SELECT'", () => {
        expect(SqliteFormatter(' SELECT foo bar', 2)).toEqual('SELECT foo bar');
      });
      it("formatting of '(SELECT'", () => {
        expect(SqliteFormatter('foo (SELECT bar', 2)).toEqual(
          'foo\n  (SELECT bar'
        );
      });
      it("formatting of '( SELECT'", () => {
        expect(SqliteFormatter('foo ( SELECT bar', 2)).toEqual(
          'foo\n  (SELECT bar'
        );
      });
      it("formatting of ') SELECT'", () => {
        expect(SqliteFormatter('foo) SELECT bar', 2)).toEqual(
          'foo)\nSELECT bar'
        );
      });
      it("formatting of ')SELECT'", () => {
        expect(SqliteFormatter('foo)SELECT bar', 2)).toEqual(
          'foo)\nSELECT bar'
        );
      });
      it('Formatting when selecting multiple fields', () => {
        expect(SqliteFormatter('SELECT foo, bar, baz', 2)).toEqual(
          'SELECT foo,\n    bar,\n    baz'
        );
      });
    });

    describe('UPDATEs', () => {
      it("formatting of 'UPDATE'", () => {
        expect(SqliteFormatter('UPDATE foo bar', 2)).toEqual('UPDATE foo bar');
      });
      it("formatting of ' UPDATE'", () => {
        expect(SqliteFormatter(' UPDATE foo bar', 2)).toEqual('UPDATE foo bar');
      });
    });

    describe('DELETEs', () => {
      it("formatting of 'DELETE'", () => {
        expect(SqliteFormatter('DELETE foo bar', 2)).toEqual('DELETE foo bar');
      });
      it("formatting of ' DELETE'", () => {
        expect(SqliteFormatter(' DELETE foo bar', 2)).toEqual('DELETE foo bar');
      });
    });

    describe('special case keywords', () => {
      it("formatting of 'THEN'", () => {
        expect(SqliteFormatter('foo THEN bar', 2)).toEqual('foo THEN\n  bar');
      });
      it("formatting of 'UNION'", () => {
        expect(SqliteFormatter('foo UNION bar', 2)).toEqual('foo\nUNION\nbar');
      });
      it("formatting of 'USING'", () => {
        expect(SqliteFormatter('foo USING bar', 2)).toEqual('foo\nUSING bar');
      });
    });

    describe('nested queries', () => {
      it('formatting of single nested query', () => {
        expect(
          SqliteFormatter('SELECT foo FROM (SELECT bar FROM baz)', 2)
        ).toEqual('SELECT foo\nFROM\n  (SELECT bar\n  FROM baz)');
      });

      it('formatting of multiple nested queries', () => {
        expect(
          SqliteFormatter(
            'SELECT foo FROM (SELECT bar FROM (SELECT baz FROM quux))',
            2
          )
        ).toEqual(
          'SELECT foo\nFROM\n  (SELECT bar\n  FROM\n    (SELECT baz\n    FROM quux))'
        );
      });
    });
  });
});
