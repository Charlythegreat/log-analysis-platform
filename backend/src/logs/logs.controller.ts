import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { CreateLogDto } from './dto/create-log.dto';
import { QueryLogsDto } from './dto/query-logs.dto';

@ApiTags('logs')
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a log entry (structured)' })
  @ApiResponse({ status: 201, description: 'Log entry created' })
  create(@Body() createLogDto: CreateLogDto) {
    return this.logsService.create(createLogDto);
  }

  @Get()
  @ApiOperation({ summary: 'Query logs with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated log results' })
  findAll(@Query() query: QueryLogsDto) {
    return this.logsService.findAll(query);
  }
}
