# ELK Stack Setup Guide

## Quick Start with Docker Compose

Create `docker-compose.yml` in your project root:

```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - elk

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - elk

volumes:
  elasticsearch_data:

networks:
  elk:
    driver: bridge
```

## Starting ELK Stack

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f elasticsearch

# Stop services
docker-compose down
```

## Verify Installation

### 1. Check Elasticsearch Health

```bash
curl http://localhost:9200/_cluster/health
```

Expected output:

```json
{
  "cluster_name": "docker-cluster",
  "status": "green",
  "timed_out": false
}
```

### 2. Access Kibana

Navigate to <http://localhost:5601>

### 3. Create Index Pattern

1. Go to **Stack Management** (gear icon)
2. Click **Index Patterns**
3. Click **Create index pattern**
4. Index pattern name: `logs-*`
5. Time field: `@timestamp`
6. Click **Create index pattern**

## Configure Your Application

Add to `.env`:

```env
ELK_ENABLED=true
ELK_HOST=localhost
ELK_PORT=9200
SERVICE_NAME=reportes-backend
```

## Querying Logs in Kibana

### View All Logs

1. Go to **Discover**
2. Select `logs-*` index pattern
3. View logs in real-time

### Filter by Level

In the search bar:

```text
level: "error"
```

### Filter by Service

```text
service: "reportes-backend"
```

### Filter by Date Range

Use the time picker in top-right corner

## Creating Dashboards

1. Go to **Dashboards**
2. Click **Create new dashboard**
3. Add visualizations:
   - Error count over time
   - Errors by service
   - Log level distribution

### Example: Error Count Visualization

1. Create a new visualization
2. Select Elasticsearch source
3. Metric: Count
4. Split series: Terms on `level.keyword`
5. Filter: `level: "error"`

## Production Considerations

### 1. Enable Security

Set in `docker-compose.yml`:

```yaml
xpack.security.enabled=true
```

Create users and passwords for production.

### 2. Adjust Heap Size

For larger deployments:

```yaml
ES_JAVA_OPTS: "-Xms1g -Xmx1g"
```

### 3. Log Retention

Modify log rotation in `logger.service.ts`:

```typescript
maxFiles: 30, // Keep 30 days
maxSize: '100m', // 100MB per file
```

### 4. Performance Tuning

- Use bulk indexing for high volume
- Implement sampling for non-critical logs
- Archive old indices monthly

## Troubleshooting

| Issue | Solution |
| ----- | -------- |
| Connection refused | Check ELK_HOST and ELK_PORT, ensure docker-compose is running |
| Index pattern not visible | Wait 30 seconds for logs to appear, refresh Kibana |
| High disk usage | Enable index lifecycle management (ILM) or reduce LOG_DIR retention |
| Slow queries | Check Elasticsearch heap size, increase if needed |

## Resources

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Kibana User Guide](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Winston Elasticsearch Transport](https://github.com/vanthome/winston-elasticsearch)
