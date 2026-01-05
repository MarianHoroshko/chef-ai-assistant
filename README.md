# Chef assistant

## Description

An intelligent cooking and event-planning assistant that guides you through organizing gatherings and produces well-structured notes along the way.
<img width="1919" height="858" alt="image" src="https://github.com/user-attachments/assets/17d5366a-d68d-441d-81a8-d8f4c9d1717e" />
<img width="1919" height="897" alt="image" src="https://github.com/user-attachments/assets/7607147d-8f45-4a42-823f-3cabc6241a08" />


## How to set up

### Backend

1. Clone repository
2. Install packages for editor intellisense

```bash
    npm i
```

3. Generate venv

```bash
    python -m venv venv  # on Windows
    python3 -m venv venv # on Linux, Mac
```

4. Activate venv

```bash
    .\venv\Scripts\activate        # on Windows
    source ./venv/scripts/activate # on Linux, Mac
```

5. Install dependencies

```bash
    pip install -r .\requirements.txt
```

6. Run script to fill vector db for RAG

```bash
    make fill-vector-db
```

7. Run to build container

```bash
    make build
```

8. Run development environment

```bash
    make up
```

### Frontend

1. Install packages

```bash
    make install-frontend
```

2. Run frontend

```bash
    make up-frontend
```

## Useful

### Backend

### For formatting use

```bash
    make format
```

### To check project for errors

```bash
    make lint
```

### How to test api

You can run script that answers basic questions required to generate initial note.

Run

```bash
    make test-api
```

> Warning: Make sure project is running, before running tests.
