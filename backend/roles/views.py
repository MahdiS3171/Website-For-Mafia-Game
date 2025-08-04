from django.shortcuts import render, redirect, get_object_or_404
from .models import Role
from .forms import RoleForm


def role_list(request):
    roles = Role.objects.all().order_by('order')
    return render(request, 'roles/role_list.html', {'roles': roles})


def role_create(request):
    if request.method == 'POST':
        form = RoleForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('roles:list')
    else:
        form = RoleForm()
    return render(request, 'roles/role_form.html', {'form': form})


def role_edit(request, pk):
    role = get_object_or_404(Role, pk=pk)
    if request.method == 'POST':
        form = RoleForm(request.POST, instance=role)
        if form.is_valid():
            form.save()
            return redirect('roles:list')
    else:
        form = RoleForm(instance=role)
    return render(request, 'roles/role_form.html', {'form': form, 'role': role})


def role_delete(request, pk):
    role = get_object_or_404(Role, pk=pk)
    if request.method == 'POST':
        role.delete()
        return redirect('roles:list')
    return render(request, 'roles/role_confirm_delete.html', {'role': role})