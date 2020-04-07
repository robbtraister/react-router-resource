function fetchOne(url: string) {
  return Promise.resolve({
    json: () => ({
      id: "abc",
      name: "def",
      predictorId: "xyz"
    })
  });
}
function fetchAll(url: string) {
  return Promise.resolve({
    json: () => [
      {
        id: "abc",
        name: "def",
        predictorId: "xyz"
      }
    ]
  });
}

// class Predictor {
//   private static _cache = {};

//   static get(id): Promise<Predictor> {
//     this._cache[id] =
//       this._cache[id] ||
//       window
//         .fetch(`/predictors/${id}`)
//         .then(resp => resp.json())
//         .then(data => new Predictor(data));

//     return this._cache[id];
//   }
// }

interface Query {
  [key: string]: string | number | boolean;
}

function serialize(query: Query, defaults?: Query): string {
  return Object.keys(defaults || query)
    .sort()
    .map(key => `${key}=${key in query ? query[key] : defaults[key]}`)
    .join("&");
}

type ClientProps = "type" | "endpoint" | "defaults";
class Client<T extends { id: string }> {
  readonly type: { new (payload: object): T };
  readonly endpoint: string;
  readonly defaults?: Query;

  private cache = {
    items: {},
    pages: {}
  };

  constructor(props: Pick<Client<T>, ClientProps>) {
    Object.assign(this, props, { endpoint: props.endpoint.replace(/\/$/, "") });
  }

  get(id: string): Promise<T>;
  get(id: string, cb: (err: Error, payload?: T) => void): void;
  get(id: string, cb?: (err: Error, payload?: T) => void) {
    if (cb) {
      const obj = this.cache.items[id];
      if (obj) {
        cb(null, obj);
      }
    }

    const promise = fetchOne(`${this.endpoint}/${id}`)
      .then(resp => resp.json())
      .then(datum => new this.type(datum))
      .then(obj => (this.cache.items[id] = obj));

    if (cb) {
      promise
        .then(obj => {
          cb(null, obj);
        })
        .catch(err => {
          cb(err);
        });
    } else {
      return promise;
    }
  }

  list(query?: Query): Promise<T[]>;
  list(query: Query, cb: (err: Error, payload?: T[]) => void): void;
  list(query: Query = {}, cb?: (err: Error, payload?: T[]) => void) {
    const queryString = serialize(query, this.defaults);

    if (cb) {
      const page = this.cache.pages[queryString];
      if (page) {
        cb(
          null,
          page.map(id => this.cache.items[id])
        );
      }
    }

    const promise = fetchAll(`${this.endpoint}?${queryString}`)
      .then(resp => resp.json())
      .then(data => data.map(datum => new this.type(datum)))
      .then(objs => {
        this.cache.pages[queryString] = objs.map(obj => obj.id);
        objs.forEach(obj => {
          this.cache.items[obj.id] = obj;
        });
        return objs;
      });

    if (cb) {
      promise
        .then(objs => {
          cb(null, objs);
        })
        .catch(err => {
          cb(err);
        });
    } else {
      return promise;
    }
  }

  private static cache = {};

  static get<U extends { id: string }>(
    props: Pick<Client<U>, ClientProps>
  ): Client<U> {
    const serial = props.endpoint;
    return (this.cache[serial] = this.cache[serial] || new Client(props));
  }
}

type WorkflowProps = "id" | "name" | "predictorId";
class Workflow {
  readonly id: string;
  readonly name: string;
  readonly predictorId: string;

  constructor(props: Pick<Workflow, WorkflowProps>) {
    Object.assign(this, props);
  }
}

type ProjectProps = "id" | "name";
class Project {
  readonly id: string;
  readonly name: string;

  constructor(props: Pick<Project, ProjectProps>) {
    Object.assign(this, props);

    this.workflows = Client.get({
      type: Workflow,
      endpoint: `/projects/${this.id}/workflows`,
      defaults: {
        page: 1,
        perPage: 20
      }
    });
  }
}

const projectsClient = Client.get({
  type: Project,
  endpoint: "/projects",
  defaults: {
    page: 1,
    perPage: 20
  }
});

// workflowsClient.get("abc", (_, workflow) => {
//   console.log(workflow.name);
// });
// workflowsClient.list({ page: 2 }).then(workflows => {
//   console.log(workflows.map(workflow => workflow.name));
// });

// console.log(workflow.nameTest);
