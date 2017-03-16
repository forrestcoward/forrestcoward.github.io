<h1>Git Submodule Merge Conflicts</h1>

A submodule merge conflict is possible if the submodule commit diverges independently in some set of branches. When two branches from this set are merged together, git cannot not resolve which commit of the submodule to use as the merge result, resulting in a conflict.

<h4>Examining Submodule Merge Conflicts</h4>

```git status``` will tell you which submodules have conflicts:

```
> git status
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
        both modified:   <submodule>
```

This status message will appear regardless of the [ignore](https://git-scm.com/docs/gitmodules#gitmodules-submoduleltnamegtignore) setting of the submodule, because this conflict represents a conflict in the super repository content, not the submodule content.

Run ```git diff``` to reveal the conflicting commits. Multiple outputs exist depending on the state of the repository:

<i>1) The submodule repository exists on disk</i>

```
> git diff
diff --cc <submodule>
index <commit1>,<commit2>..0000000
--- a/<submodule>
+++ b/<submodule>
```

<i>2) The submodule repository does not exist on disk</i>

```
> git diff
- Subproject commit <commit1>
 -Subproject commit <commit2>
++Subproject commit 0000000000000000000000000000000000000000
```

<h4>Resolving Submodule Merge Conflicts</h4>

The git metadata for a submodule is stored in ```.git\modules\<submodule>```. Resolution of a submodule merge conflict is essentially restoring this folder to proper state and then running ```git add <path-to-submodule>```.

If the submodule exists on disk (scenario one above), one resolution strategy is enter the submodule directory and check out the submodule to the correct commit id:

```
cd <path-to-submodule>
git checkout <commit1|commit2>
cd <repository-root>
git add <path-to-submodule>
```

Another similiar resolution strategy is:

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

Fortunately, you can use a ```git reset``` to modify the index directly:

```
> git reset <source-branch> -- <path-to-submodule>
# git reset <target-branch> -- <path-to-submodule>

> git status
All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)
```

Finally, if the submodule does not exist on disk, you could manually clone the submodule into the submodule path and use a strategy from scenario one.
