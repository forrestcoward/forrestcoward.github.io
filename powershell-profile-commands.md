<h3>Discover Your Powershell Profile</h3>

```
echo $profile
```

<h3>Edit Powershell Profile</h3>

```powershell
function editprofile 
{ 
    notepad++ $profile 
}
```

<h3>Load Powershell Profile</h3>

```powershell
function loadprofile 
{ 
    powershell $profile
}
```

<h3>Open Current Git Repository In Browser</h3>

```powershell
function openrepo 
{
    $repo = git config --get remote.origin.url
    (New-Object -Com Shell.Application).Open($repo)
}
```

<h3>Revert Last Git Commit</h3>

```powershell
function resetlastcommit 
{
    git reset --soft HEAD~1 
}
```

<h3>Delete Local Git Branch</h3>

```powershell
function deletelocalbranch($branch) 
{
    git fetch -p 
    git branch -D $branch
}
```

<h3>Delete Remote Git Branch</h3>

```powershell
function deleteremotebranch($branch) 
{
    git fetch -p 
    git push origin :$branch
}
```

<h3>Delete Local & Remote Git Branch</h3>

```powershell
function deletebranch($branch) 
{
    deleteLocalBranch($branch)
    deleteRemoteBranch($branch)
}
```

<h3>Create A Git Branch</h3>

```powershell
function createBranch($branch) 
{
    git checkout -b $branch
    git push --set-upstream origin $branch
}
```

<h3>Search Recursively For Text</h3>

```powershell
function findstrall ($string) 
{
    cmd.exe /c findstr /spin /c:"$string" *.*
}
```

<h3>Search Recursively For Text In Target Files</h3>

```powershell
function findstrtarget ($string, $target) 
{
    cmd.exe /c findstr /spin /c:"$string" $target
}
```

<h3>View Path Variables</h3>

```powershell
function printpath
{
    $env:path.Split(";") | ForEach { Write-Host $_ }
}
```



