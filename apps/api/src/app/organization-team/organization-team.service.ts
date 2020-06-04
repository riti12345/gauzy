import {
	Injectable,
	BadRequestException,
	HttpException,
	HttpStatus
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { CrudService } from '../core/crud/crud.service';
import {
	OrganizationTeamCreateInput as IOrganizationTeamCreateInput,
	OrganizationTeam as IOrganizationTeam
} from '@gauzy/models';
import { IPagination } from '../core';
import { Employee } from '../employee/employee.entity';
import { User } from '../user/user.entity';
import { OrganizationTeam } from './organization-team.entity';
import { OrganizationTeamEmployee } from '../organization-team-employee/organization-team-employee.entity';
import { RequestContext } from '../core/context';
import { RoleService } from '../role/role.service';
import { EmployeeService } from '../employee/employee.service';

@Injectable()
export class OrganizationTeamService extends CrudService<OrganizationTeam> {
	constructor(
		@InjectRepository(OrganizationTeam)
		private readonly organizationTeamRepository: Repository<
			OrganizationTeam
		>,
		@InjectRepository(Employee)
		private readonly employeeRepository: Repository<Employee>,
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		private readonly employeeService: EmployeeService,
		private readonly roleService: RoleService
	) {
		super(organizationTeamRepository);
	}

	async createOrgTeam(
		entity: IOrganizationTeamCreateInput
	): Promise<OrganizationTeam> {
		const organizationTeam = new OrganizationTeam();
		organizationTeam.name = entity.name;
		organizationTeam.organizationId = entity.organizationId;
		organizationTeam.tags = entity.tags;

		const employees = await this.employeeRepository.findByIds(
			entity.members,
			{
				relations: ['user', 'tags']
			}
		);

		const teamEmployees: OrganizationTeamEmployee[] = [];
		employees.forEach((employee) => {
			const teamEmployee = new OrganizationTeamEmployee();
			teamEmployee.employeeId = employee.id;
			teamEmployee.employee = employee;
			teamEmployees.push(teamEmployee);
		});
		organizationTeam.members = teamEmployees;

		return this.organizationTeamRepository.save(organizationTeam);
	}

	async updateOrgTeam(
		id: string,
		entity: IOrganizationTeamCreateInput
	): Promise<OrganizationTeam> {
		try {
			await this.organizationTeamRepository.delete(id);

			const organizationTeam = new OrganizationTeam();
			organizationTeam.name = entity.name;
			organizationTeam.organizationId = entity.organizationId;
			organizationTeam.tags = entity.tags;
			const employees = await this.employeeRepository.findByIds(
				entity.members,
				{
					relations: ['user', 'tags']
				}
			);

			const teamEmployees: OrganizationTeamEmployee[] = [];
			employees.forEach((employee) => {
				const teamEmployee = new OrganizationTeamEmployee();
				teamEmployee.employeeId = employee.id;
				teamEmployee.employee = employee;
				teamEmployees.push(teamEmployee);
			});
			organizationTeam.members = teamEmployees;

			return this.organizationTeamRepository.save(organizationTeam);
		} catch (err /*: WriteError*/) {
			throw new BadRequestException(err);
		}
	}

	async getAllOrgTeams(
		filter: FindManyOptions<OrganizationTeam>
	): Promise<IPagination<IOrganizationTeam>> {
		const total = await this.organizationTeamRepository.count(filter);

		const items = await this.organizationTeamRepository.find(filter);

		for (const orgTeams of items) {
			for (const teamEmp of orgTeams.members) {
				const emp = await this.employeeRepository.findOne(
					teamEmp.employeeId
				);
				emp.user = await this.userRepository.findOne(emp.userId);
				teamEmp.employee = emp;
			}
		}

		return { items, total };
	}

	async getMyOrgTeams(
		filter: FindManyOptions<OrganizationTeam>,
		employeeId
	): Promise<IPagination<IOrganizationTeam>> {
		const teams: OrganizationTeam[] = [];
		const items = await this.organizationTeamRepository.find(filter);

		for (const orgTeams of items) {
			for (const teamEmp of orgTeams.members) {
				if (employeeId === teamEmp.employeeId) {
					teams.push(orgTeams);
					break;
				}
			}
		}

		return { items: teams, total: teams.length };
	}

	async findMyTeams(relations, findInput, employeeId) {
		// If user is not an employee, then this will return 404
		let employee: any = { id: undefined };
		let role;
		try {
			employee = await this.employeeService.findOne({
				where: {
					user: { id: RequestContext.currentUser().id }
				}
			});
		} catch (e) {}

		try {
			const roleId = RequestContext.currentUser().roleId;
			if (roleId) {
				role = await this.roleService.findOne(roleId);
			}
		} catch (e) {}

		// selected user not passed
		if (employeeId) {
			if (role.name === 'ADMIN' || role.name === 'SUPER_ADMIN') {
				return this.getAllOrgTeams({
					where: findInput,
					relations
				});
			} else if (employeeId === employee.id) {
				return this.getMyOrgTeams(
					{
						where: findInput,
						relations
					},
					employee.id
				);
			} else {
				throw new HttpException(
					'Unauthorized',
					HttpStatus.UNAUTHORIZED
				);
			}
		} else {
			if (role.name === 'ADMIN' || role.name === 'SUPER_ADMIN') {
				return this.getAllOrgTeams({
					where: findInput,
					relations
				});
			} else {
				return this.getMyOrgTeams(
					{
						where: findInput,
						relations
					},
					employee.id
				);
			}
		}
	}
}
