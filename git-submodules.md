<b>Examining Submodule Merge Conflicts</b>

If the submodule commit diverges independently in some set of branches, this introduces the possibility of merge conflicts within the submodule path when these branches are merged.

```
> git status
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
        both modified:   <submodule>
```

This status message will appear regardless of the [ignore](https://git-scm.com/docs/gitmodules#gitmodules-submoduleltnamegtignore) setting of the submodule, because this conflict represents a conflict in the main repository, not the submodule itself.

Run ```git diff``` to discover what the conflicting commits are. There are two possible outputs:

<i>1) The submodule repository exists on disk</i>

```
> git diff
diff --cc <submodule>
index <commit1>,<commit2>..0000000
--- a/<submodule>
+++ b/<submodule>
```

<i>2) The submodule does not exist on disk</i>

```
> git diff
- Subproject commit <commit1>
 -Subproject commit <commit2>
++Subproject commit 0000000000000000000000000000000000000000
```

<b>Resolving Submodule Merge Conflicts</b>

The git metadata for a submodule is stored in ```.git\modules\<submodule>```. Resolution of a submodule merge conflicts is essentially getting this folder in the proper state and then running ```git add <path-to-submodule>```.

If the submodule exists on disk (scenario one above), one resolution strategy is entering the submodule directory and checking out the submodule to the correct commit id.

```
cd <path-to-submodule>
git checkout <commit1|commit2>
cd <repository-root>
git add <path-to-submodule>
```

Another possible resolution strategy is

```
git checkout --ours <path-to-submodule> 
# git checkout --theirs <path-to-submodule>
git add <path-to-submodule>
```

If the submodule does exist on disk (scenario two above), then neither of these strategies will suffice. Entering the submodule and checking out fails because there is no submodule repository. The ```-ours``` or ```-theirs``` checkout strategy does nothing, and attempting to retrieve the submodule via `git submodule update` fails:

```
> git diff
- Subproject commit <commit1>
 -Subproject commit <commit2>
++Subproject commit 0000000000000000000000000000000000000000

> git checkout --ours <path-to-submodule>

> git status
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)

        both modified: <submodule>
        
> git submodule update
Skipping unmerged submodule <path-to-submodule>
```

Fortunately, you can use a ```git reset``` to modify the index.

```
> git reset <source-branch> -- <path-to-submodule>
# git reset <target-branch> -- <path-to-submodule>

> git status
All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)
```